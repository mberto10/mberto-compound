#!/usr/bin/env python3
"""Assemble structured codebase context for frontier reasoning models.

Produces a markdown document combining subsystem YAMLs, git commits,
Linear project state, and a prompt template — ready to paste into
a reasoning model (Gemini Deep Think, o3, etc.).
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple

try:
    import yaml
except ImportError:
    yaml = None


# ---------------------------------------------------------------------------
# YAML loading (with graceful fallback)
# ---------------------------------------------------------------------------

def _parse_yaml(text: str) -> dict:
    """Parse YAML text, falling back to a best-effort parser if PyYAML absent."""
    if yaml:
        return yaml.safe_load(text) or {}
    # Minimal fallback: return raw text wrapped in a dict
    return {"_raw": text}


def _read_yaml_file(path: Path) -> Optional[dict]:
    """Read and parse a YAML file. Returns None on failure."""
    try:
        return _parse_yaml(path.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"WARNING: Could not read {path}: {e}", file=sys.stderr)
        return None


# ---------------------------------------------------------------------------
# Subsystem loading
# ---------------------------------------------------------------------------

def _find_subsystem_yaml(spec: str, cwd: Path) -> Optional[Path]:
    """Resolve a subsystem spec like 'backend/api' to a YAML path."""
    base = cwd / "subsystems_knowledge"
    if not base.exists():
        return None
    # Try exact path first
    candidate = base / f"{spec}.yaml"
    if candidate.exists():
        return candidate
    candidate = base / f"{spec}.yml"
    if candidate.exists():
        return candidate
    # Try globbing
    parts = spec.split("/")
    for ext in ("yaml", "yml"):
        pattern = "/".join(parts) + f".{ext}"
        matches = list(base.glob(pattern))
        if matches:
            return matches[0]
    return None


def _resolve_deps(data: dict, depth: int = 0, max_depth: int = 2) -> List[str]:
    """Extract transitive dependency subsystem IDs from a parsed YAML."""
    if depth >= max_depth:
        return []
    deps = set()
    dep_section = data.get("dependencies", {})
    for key in ("compile_time", "runtime"):
        items = dep_section.get(key, [])
        if isinstance(items, list):
            for item in items:
                if isinstance(item, str):
                    deps.add(item)
                elif isinstance(item, dict) and "subsystem" in item:
                    deps.add(item["subsystem"])
    return list(deps)


def load_subsystem_yamls(specs: List[str], cwd: Path) -> Tuple[Dict[str, str], List[str]]:
    """Load specific subsystem YAMLs with transitive deps (max 2 hops).

    Returns (loaded: {spec: yaml_text}, warnings: [str]).
    """
    loaded: Dict[str, str] = {}
    warnings: List[str] = []
    to_process = list(specs)
    seen: set = set()

    hop = 0
    while to_process and hop <= 2:
        next_round = []
        for spec in to_process:
            if spec in seen:
                continue
            seen.add(spec)
            path = _find_subsystem_yaml(spec, cwd)
            if path is None:
                warnings.append(f"Subsystem '{spec}' — YAML not found")
                continue
            text = path.read_text(encoding="utf-8")
            loaded[spec] = text
            data = _parse_yaml(text)
            if data and hop < 2:
                for dep in _resolve_deps(data, depth=hop):
                    if dep not in seen:
                        next_round.append(dep)
        to_process = next_round
        hop += 1

    return loaded, warnings


def load_all_subsystems(cwd: Path) -> Tuple[Dict[str, str], List[str]]:
    """Glob all subsystem YAMLs under subsystems_knowledge/."""
    base = cwd / "subsystems_knowledge"
    if not base.exists():
        return {}, [f"Directory not found: {base}"]

    loaded: Dict[str, str] = {}
    warnings: List[str] = []
    for ext in ("yaml", "yml"):
        for path in sorted(base.rglob(f"*.{ext}")):
            spec = str(path.relative_to(base)).rsplit(".", 1)[0]
            try:
                loaded[spec] = path.read_text(encoding="utf-8")
            except Exception as e:
                warnings.append(f"Could not read {path}: {e}")
    return loaded, warnings


# ---------------------------------------------------------------------------
# Git commits
# ---------------------------------------------------------------------------

def get_commits(
    n: Optional[int] = None,
    since: Optional[str] = None,
    paths: Optional[List[str]] = None,
    cwd: Optional[Path] = None,
) -> Optional[str]:
    """Get recent git commits, optionally scoped to paths."""
    cmd = ["git", "log", "--oneline", "--no-decorate"]

    if n:
        cmd += [f"-{n}"]

    if since:
        # Convert shorthand like "2w" to git's --since format
        since_date = _parse_since(since)
        if since_date:
            cmd += [f"--since={since_date}"]

    cmd += ["--"]
    if paths:
        cmd += paths

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            cwd=str(cwd) if cwd else None,
            timeout=30,
        )
        if result.returncode != 0:
            return None
        return result.stdout.strip() or None
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return None


def _parse_since(since: str) -> Optional[str]:
    """Parse shorthand like '2w', '3d', '1m' into ISO date string."""
    since = since.strip()
    if not since:
        return None

    unit_map = {"d": "days", "w": "weeks", "m": "months"}
    # If it already looks like a date or git format, pass through
    if "-" in since or since.startswith("20"):
        return since

    try:
        num = int(since[:-1])
        unit = since[-1].lower()
    except (ValueError, IndexError):
        return since  # pass through to git

    if unit == "m":
        # Approximate months as 30 days
        delta = timedelta(days=num * 30)
    elif unit in ("d", "w"):
        kwargs = {unit_map[unit]: num}
        delta = timedelta(**kwargs)
    else:
        return since

    target = datetime.now() - delta
    return target.strftime("%Y-%m-%d")


def _extract_owned_paths(yamls: Dict[str, str]) -> List[str]:
    """Extract paths.owned from loaded YAML texts."""
    paths = []
    for text in yamls.values():
        data = _parse_yaml(text)
        if not data:
            continue
        owned = (data.get("paths") or {}).get("owned", [])
        if isinstance(owned, list):
            paths.extend(owned)
        elif isinstance(owned, str):
            paths.append(owned)
    return paths


# ---------------------------------------------------------------------------
# Templates
# ---------------------------------------------------------------------------

def load_template(name: str, plugin_root: Optional[Path] = None) -> Optional[str]:
    """Load a prompt template by name."""
    if plugin_root is None:
        plugin_root = Path(__file__).resolve().parent.parent

    template_dir = plugin_root / "templates"
    for ext in ("md", "txt"):
        path = template_dir / f"{name}.{ext}"
        if path.exists():
            return path.read_text(encoding="utf-8")
    return None


# ---------------------------------------------------------------------------
# Document assembly
# ---------------------------------------------------------------------------

def assemble_document(
    question: Optional[str] = None,
    subsystem_yamls: Optional[Dict[str, str]] = None,
    subsystem_warnings: Optional[List[str]] = None,
    linear_context: Optional[str] = None,
    commits: Optional[str] = None,
    template: Optional[str] = None,
    template_name: Optional[str] = None,
) -> str:
    """Produce the final structured markdown context document."""
    sections: List[str] = []
    now = datetime.now().strftime("%Y-%m-%d %H:%M")

    # Header
    sections.append(f"# Strategic Reasoning Context\n\nGenerated: {now}\n")

    # Question
    if question:
        sections.append(f"## Question\n\n{question}\n")

    # Subsystem Knowledge
    if subsystem_yamls:
        parts = ["## Subsystem Knowledge\n"]
        for spec, text in sorted(subsystem_yamls.items()):
            parts.append(f"### `{spec}`\n\n```yaml\n{text.rstrip()}\n```\n")
        if subsystem_warnings:
            parts.append("### Warnings\n")
            for w in subsystem_warnings:
                parts.append(f"- {w}")
            parts.append("")
        sections.append("\n".join(parts))
    elif subsystem_warnings:
        sections.append(
            "## Subsystem Knowledge\n\n"
            + "*No subsystem YAMLs loaded.*\n\n"
            + "\n".join(f"- {w}" for w in subsystem_warnings)
            + "\n"
        )
    else:
        sections.append(
            "## Subsystem Knowledge\n\n"
            "*No subsystem knowledge directory found. "
            "This project may not use subsystem YAML specs yet.*\n"
        )

    # Linear Project State
    if linear_context:
        sections.append(f"## Linear Project State\n\n{linear_context.rstrip()}\n")
    else:
        sections.append(
            "## Linear Project State\n\n"
            "*No Linear context provided. "
            "If relevant, re-run with --linear-context or use `/reason gather` "
            "which fetches Linear data automatically.*\n"
        )

    # Recent Commits
    if commits:
        sections.append(f"## Recent Commits\n\n```\n{commits}\n```\n")
    else:
        sections.append(
            "## Recent Commits\n\n*No commits loaded (git not available or no matching commits).*\n"
        )

    # Prompt Template
    if template:
        label = f" ({template_name})" if template_name else ""
        sections.append(f"## Response Instructions{label}\n\n{template.rstrip()}\n")

    return "\n---\n\n".join(sections)


# ---------------------------------------------------------------------------
# Clipboard
# ---------------------------------------------------------------------------

def try_copy_to_clipboard(text: str) -> bool:
    """Best-effort copy to system clipboard. Returns True on success."""
    for cmd in (["pbcopy"], ["xclip", "-selection", "clipboard"], ["xsel", "--clipboard", "--input"]):
        try:
            proc = subprocess.run(
                cmd,
                input=text,
                text=True,
                capture_output=True,
                timeout=5,
            )
            if proc.returncode == 0:
                return True
        except (FileNotFoundError, subprocess.TimeoutExpired):
            continue
    return False


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Assemble structured codebase context for frontier reasoning models.",
    )
    parser.add_argument(
        "--subsystems",
        type=str,
        default=None,
        help="Comma-separated subsystem specs (e.g. backend/api,frontend/core-loop). "
             "Resolves transitive deps up to 2 hops.",
    )
    parser.add_argument(
        "--all-subsystems",
        action="store_true",
        help="Load all subsystem YAMLs from subsystems_knowledge/",
    )
    parser.add_argument(
        "--linear-context",
        type=str,
        default=None,
        help="Path to a pre-fetched Linear context markdown file",
    )
    parser.add_argument(
        "--commits",
        type=str,
        default=None,
        help="Number of recent commits (e.g. 20) or time-based (e.g. 2w, 3d)",
    )
    parser.add_argument(
        "--question",
        type=str,
        default=None,
        help="The strategic question to prepend",
    )
    parser.add_argument(
        "--template",
        type=str,
        default=None,
        choices=["architecture", "roadmap", "debt", "migration", "general"],
        help="Prompt template to include",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=None,
        help="Output file path (default: stdout + clipboard attempt)",
    )
    parser.add_argument(
        "--cwd",
        type=str,
        default=None,
        help="Project root directory (default: current directory)",
    )

    args = parser.parse_args()

    cwd = Path(args.cwd) if args.cwd else Path.cwd()

    # Load subsystems
    subsystem_yamls: Dict[str, str] = {}
    subsystem_warnings: List[str] = []

    if args.all_subsystems:
        subsystem_yamls, subsystem_warnings = load_all_subsystems(cwd)
    elif args.subsystems:
        specs = [s.strip() for s in args.subsystems.split(",") if s.strip()]
        subsystem_yamls, subsystem_warnings = load_subsystem_yamls(specs, cwd)

    # Load commits
    commits_text = None
    if args.commits:
        # Determine if numeric or time-based
        commit_arg = args.commits.strip()
        n = None
        since = None
        try:
            n = int(commit_arg)
        except ValueError:
            since = commit_arg

        # Scope to owned paths if specific subsystems loaded
        owned_paths = _extract_owned_paths(subsystem_yamls) if subsystem_yamls and not args.all_subsystems else None

        commits_text = get_commits(n=n, since=since, paths=owned_paths or None, cwd=cwd)

    # Load Linear context
    linear_context = None
    if args.linear_context:
        lc_path = Path(args.linear_context)
        if lc_path.exists():
            linear_context = lc_path.read_text(encoding="utf-8")
        else:
            print(f"WARNING: Linear context file not found: {lc_path}", file=sys.stderr)

    # Load template
    template_text = None
    if args.template:
        template_text = load_template(args.template)
        if template_text is None:
            print(f"WARNING: Template '{args.template}' not found", file=sys.stderr)

    # Assemble
    document = assemble_document(
        question=args.question,
        subsystem_yamls=subsystem_yamls,
        subsystem_warnings=subsystem_warnings,
        linear_context=linear_context,
        commits=commits_text,
        template=template_text,
        template_name=args.template,
    )

    # Output
    if args.output:
        out_path = Path(args.output)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(document, encoding="utf-8")
        print(f"Context document written to: {out_path}", file=sys.stderr)
    else:
        print(document)

    # Try clipboard
    if try_copy_to_clipboard(document):
        print("(Copied to clipboard)", file=sys.stderr)


if __name__ == "__main__":
    main()
