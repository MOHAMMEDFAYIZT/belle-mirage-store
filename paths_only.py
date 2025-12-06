import os

output_file = "file_paths.txt"

# Folders to exclude (add more if needed)
exclude_folders = {
    "node_modules",
    ".git",
    ".next",
    "dist",
    "build",
    ".cache",
    ".vscode",
    "coverage",
    "out",
    ".turbo",
    ".parcel-cache"
}

with open(output_file, "w", encoding="utf-8") as output:
    for root, dirs, files in os.walk("."):

        # Skip excluded folders by modifying dirs in-place
        dirs[:] = [d for d in dirs if d not in exclude_folders]

        for file in files:
            path = os.path.relpath(os.path.join(root, file)).replace("\\", "/")
            output.write(path + "\n")

print("✅ Done! Created file_paths.txt (excluded heavy folders)")
