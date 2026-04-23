from __future__ import annotations

import argparse
import json
from pathlib import Path

from src.analysis import run_analysis
from src.ingest import create_demo_zip, import_transcripts_zip


def print_summary(manifest: dict, bundle: dict) -> None:
    outputs = bundle.get("outputs", {})
    summary = {
        "import_id": manifest["import_id"],
        "notes_count": manifest["notes_count"],
        "clusters_count": bundle["summary"]["clusters_count"],
        "vector_method": bundle["summary"]["vector_method"],
        "analysis_bundle": str(Path(manifest["processed_dir"]) / "analysis_bundle.json"),
        "wordcloud_png": outputs.get("wordcloud_png"),
        "theme_graph_html": outputs.get("theme_graph_html"),
        "cluster_view_html": outputs.get("cluster_view_html"),
    }
    print(json.dumps(summary, indent=2, ensure_ascii=False))


def run_import(zip_path: Path, root: Path | None = None) -> None:
    manifest = import_transcripts_zip(zip_path, root=root)
    bundle = run_analysis(manifest["import_id"], root=root)
    print_summary(manifest, bundle)


def main() -> None:
    parser = argparse.ArgumentParser(description="Antigone local transcript analysis")
    subparsers = parser.add_subparsers(dest="command", required=True)

    import_parser = subparsers.add_parser("import", help="Import a transcript ZIP and run analysis")
    import_parser.add_argument("zip_path", type=Path, help="Path to a ZIP file containing .txt, .md, or .csv transcripts")
    import_parser.add_argument("--root", type=Path, default=None, help="Repository root override")

    demo_parser = subparsers.add_parser("demo", help="Create and import the bundled demo ZIP")
    demo_parser.add_argument("--root", type=Path, default=None, help="Repository root override")

    analyze_parser = subparsers.add_parser("analyze", help="Re-run analysis for an existing import")
    analyze_parser.add_argument("import_id", nargs="?", default=None, help="Import id. Defaults to latest import.")
    analyze_parser.add_argument("--root", type=Path, default=None, help="Repository root override")

    args = parser.parse_args()

    if args.command == "import":
        run_import(args.zip_path, args.root)
    elif args.command == "demo":
        demo_zip = create_demo_zip(args.root)
        run_import(demo_zip, args.root)
    elif args.command == "analyze":
        bundle = run_analysis(args.import_id, root=args.root)
        print(json.dumps({"import_id": bundle["import_id"], "summary": bundle["summary"], "outputs": bundle["outputs"]}, indent=2))


if __name__ == "__main__":
    main()
