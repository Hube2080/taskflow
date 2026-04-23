from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import networkx as nx
import pandas as pd
import plotly.graph_objects as go
from wordcloud import WordCloud


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")


def make_wordcloud(bundle: dict[str, Any], repo_root: Path) -> Path | None:
    frequencies = {item["term"]: int(item["count"]) for item in bundle.get("keywords", [])}
    if not frequencies:
        return None

    output_path = repo_root / "outputs" / "wordclouds" / f"{bundle['import_id']}_wordcloud.png"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    cloud = WordCloud(
        width=1800,
        height=960,
        background_color="#f7f3ec",
        colormap="copper",
        prefer_horizontal=0.88,
        max_words=160,
        contour_width=1,
        contour_color="#d6cbbb",
        random_state=42,
    ).generate_from_frequencies(frequencies)
    cloud.to_file(str(output_path))
    return output_path


def build_theme_graph(bundle: dict[str, Any], repo_root: Path) -> tuple[Path, Path | None]:
    nodes = bundle.get("theme_nodes", [])
    edges = bundle.get("theme_edges", [])
    graph_payload = {
        "import_id": bundle["import_id"],
        "nodes": nodes,
        "edges": edges,
    }
    json_path = repo_root / "outputs" / "graphs" / f"{bundle['import_id']}_theme_graph.json"
    write_json(json_path, graph_payload)

    if not nodes:
        return json_path, None

    graph = nx.Graph()
    for node in nodes:
        graph.add_node(node["id"], label=node["label"], weight=node.get("weight", 1))
    for edge in edges:
        if edge["source"] in graph and edge["target"] in graph:
            graph.add_edge(edge["source"], edge["target"], weight=edge.get("weight", 1))

    if graph.number_of_nodes() == 0:
        return json_path, None

    positions = nx.spring_layout(graph, seed=42, k=0.8)
    edge_x: list[float | None] = []
    edge_y: list[float | None] = []
    for source, target in graph.edges():
        x0, y0 = positions[source]
        x1, y1 = positions[target]
        edge_x.extend([float(x0), float(x1), None])
        edge_y.extend([float(y0), float(y1), None])

    edge_trace = go.Scatter(
        x=edge_x,
        y=edge_y,
        mode="lines",
        line={"width": 0.8, "color": "rgba(92, 76, 55, 0.28)"},
        hoverinfo="none",
    )
    node_x = [float(positions[node][0]) for node in graph.nodes()]
    node_y = [float(positions[node][1]) for node in graph.nodes()]
    labels = [graph.nodes[node]["label"] for node in graph.nodes()]
    weights = [graph.nodes[node].get("weight", 1) for node in graph.nodes()]

    node_trace = go.Scatter(
        x=node_x,
        y=node_y,
        mode="markers+text",
        text=labels,
        textposition="top center",
        marker={
            "size": [max(12, min(38, 10 + weight * 4)) for weight in weights],
            "color": weights,
            "colorscale": "YlOrBr",
            "line": {"width": 1, "color": "#6f5c3f"},
        },
        hovertemplate="%{text}<extra></extra>",
    )
    fig = go.Figure(data=[edge_trace, node_trace])
    fig.update_layout(
        template="plotly_white",
        paper_bgcolor="#f7f3ec",
        plot_bgcolor="#f7f3ec",
        margin={"l": 16, "r": 16, "t": 16, "b": 16},
        showlegend=False,
        xaxis={"visible": False},
        yaxis={"visible": False},
        height=680,
    )
    html_path = repo_root / "outputs" / "graphs" / f"{bundle['import_id']}_theme_graph.html"
    fig.write_html(str(html_path), include_plotlyjs="cdn", full_html=True)
    return json_path, html_path


def build_cluster_plot(bundle: dict[str, Any], repo_root: Path) -> Path | None:
    notes = bundle.get("notes", [])
    if not notes:
        return None
    frame = pd.DataFrame(notes)
    fig = go.Figure(
        data=[
            go.Scatter(
                x=frame["x"],
                y=frame["y"],
                mode="markers+text",
                text=frame["title"],
                textposition="top center",
                marker={
                    "size": 16,
                    "color": frame["cluster_id"],
                    "colorscale": "Tealgrn",
                    "line": {"width": 1, "color": "#34423c"},
                },
                customdata=frame[["cluster_label", "source_file", "excerpt"]],
                hovertemplate="<b>%{text}</b><br>%{customdata[0]}<br>%{customdata[1]}<br><br>%{customdata[2]}<extra></extra>",
            )
        ]
    )
    fig.update_layout(
        template="plotly_white",
        paper_bgcolor="#f7f3ec",
        plot_bgcolor="#f7f3ec",
        margin={"l": 16, "r": 16, "t": 16, "b": 16},
        showlegend=False,
        xaxis={"visible": False},
        yaxis={"visible": False},
        height=620,
    )
    html_path = repo_root / "outputs" / "graphs" / f"{bundle['import_id']}_cluster_view.html"
    html_path.parent.mkdir(parents=True, exist_ok=True)
    fig.write_html(str(html_path), include_plotlyjs="cdn", full_html=True)
    return html_path


def build_visual_outputs(bundle: dict[str, Any], repo_root: Path) -> dict[str, str | None]:
    for directory in [
        repo_root / "outputs" / "wordclouds",
        repo_root / "outputs" / "graphs",
        repo_root / "outputs" / "analysis",
    ]:
        directory.mkdir(parents=True, exist_ok=True)

    wordcloud_path = make_wordcloud(bundle, repo_root)
    graph_json_path, graph_html_path = build_theme_graph(bundle, repo_root)
    cluster_html_path = build_cluster_plot(bundle, repo_root)

    return {
        "wordcloud_png": str(wordcloud_path) if wordcloud_path else None,
        "theme_graph_json": str(graph_json_path),
        "theme_graph_html": str(graph_html_path) if graph_html_path else None,
        "cluster_view_html": str(cluster_html_path) if cluster_html_path else None,
    }
