#!/usr/bin/env python3

import argparse
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Optional


ROOT = Path(__file__).parent


USE_COLOR = sys.stdout.isatty() and sys.stderr.isatty()


def color(text: str, code: str) -> str:
    if not USE_COLOR:
        return text
    return f"\033[{code}m{text}\033[0m"


def cyan(text: str) -> str:
    return color(text, "36")


def green(text: str) -> str:
    return color(text, "32")


def yellow(text: str) -> str:
    return color(text, "33")


def red(text: str) -> str:
    return color(text, "31")


def bold(text: str) -> str:
    return color(text, "1")


def compose_cmd() -> list[str]:
    if shutil.which("docker-compose"):
        return ["docker-compose"]
    if shutil.which("docker"):
        return ["docker", "compose"]
    print(red("Error: Docker Compose is required."), file=sys.stderr)
    sys.exit(1)


def compose(*args: str) -> None:
    subprocess.run(compose_cmd() + list(args), cwd=ROOT, check=True)


def build() -> None:
    compose("build")


def start() -> None:
    compose("up", "-d")


def rebuild() -> None:
    compose("down", "--remove-orphans")
    compose("up", "-d", "--build")


def scan(project: Optional[str]) -> None:
    start()
    target = f"/projects/{project.strip('/')}" if project else "/projects"
    compose("exec", "scanner", "node", "dist/index.js", "--path", target)


def scan_repo(repo_url: str) -> None:
    start()
    compose("exec", "scanner", "node", "dist/index.js", "--repo", repo_url)


def status() -> None:
    compose("ps")


def shell() -> None:
    start()
    compose("exec", "scanner", "bash")


def interactive() -> None:
    print(bold(cyan("OpenSourceMalware Sandboxed Manager")))
    print(f"{green('1)')} Start scanner container")
    print(f"{green('2)')} Build scanner image")
    print(f"{green('3)')} Rebuild/recreate scanner container")
    print(f"{green('4)')} Scan all projects")
    print(f"{green('5)')} Scan one project")
    print(f"{green('6)')} Scan remote repository URL")
    print(f"{green('7)')} Container status")
    print(f"{green('8)')} Shell in scanner container")

    option = input(f"{yellow('Choose an option: ')}").strip()
    if option == "1":
        start()
    elif option == "2":
        build()
    elif option == "3":
        rebuild()
    elif option == "4":
        scan(None)
    elif option == "5":
        project = input(f"{yellow('Project name under projects/: ')}").strip()
        if not project:
            print(red("Error: project name is required."), file=sys.stderr)
            sys.exit(1)
        scan(project)
    elif option == "6":
        repo_url = input(f"{yellow('Repository URL: ')}").strip()
        if not repo_url:
            print(red("Error: repository URL is required."), file=sys.stderr)
            sys.exit(1)
        scan_repo(repo_url)
    elif option == "7":
        status()
    elif option == "8":
        shell()
    else:
        print(red("Invalid option."), file=sys.stderr)
        sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Manage the sandboxed malware scanner container.",
        epilog=(
            "Examples:\n"
            "  ./manage.py rebuild\n"
            "  ./manage.py scan\n"
            "  ./manage.py scan test-project\n"
            "  ./manage.py repo https://github.com/user/repo\n"
            "  ./manage.py shell"
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    subparsers = parser.add_subparsers(dest="command")

    subparsers.add_parser(
        "start",
        help="Start the background scanner container",
        description="Start the background scanner container with Docker Compose.",
    )
    subparsers.add_parser(
        "build",
        help="Build the scanner image",
        description="Build the scanner Docker image without recreating the container.",
    )
    subparsers.add_parser(
        "rebuild",
        help="Build and recreate the scanner container",
        description="Rebuild the scanner image and recreate the container.",
    )
    subparsers.add_parser(
        "status",
        help="Show Compose container status",
        description="Show Docker Compose container status for the scanner service.",
    )
    subparsers.add_parser(
        "shell",
        help="Open a shell in the scanner container",
        description="Open an interactive Bash shell inside the running scanner container.",
    )

    scan_parser = subparsers.add_parser(
        "scan",
        help="Scan /projects or /projects/<project>",
        description="Scan all projects under /projects or a specific subfolder under projects/.",
    )
    scan_parser.add_argument(
        "project",
        nargs="?",
        help="Project folder name under projects/ (example: test-project)",
    )

    repo_parser = subparsers.add_parser(
        "repo",
        help="Scan a remote repository URL",
        description="Scan a remote repository URL through the OpenSourceMalware API.",
    )
    repo_parser.add_argument("url", help="Repository URL to scan")

    args = parser.parse_args()

    if args.command is None:
        interactive()
    elif args.command == "start":
        start()
    elif args.command == "build":
        build()
    elif args.command == "rebuild":
        rebuild()
    elif args.command == "scan":
        scan(args.project)
    elif args.command == "repo":
        scan_repo(args.url)
    elif args.command == "status":
        status()
    elif args.command == "shell":
        shell()


if __name__ == "__main__":
    try:
        main()
    except subprocess.CalledProcessError as error:
        sys.exit(error.returncode)
