import os
import json
from pathlib import Path

# Configuration
COURSES_DIR = os.path.join(os.path.dirname(__file__), '..', 'courses')
MENU_OUTPUT = os.path.join(os.path.dirname(__file__), 'menu.json')

# File extensions to include in menu
INCLUDE_EXTENSIONS = (
    '.ejagruti', '.pdf', '.xlsx', '.ipynb', '.py',  # Documents
    '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'  # Images
)

# Folders to exclude from menu generation
EXCLUDE_FOLDERS = {'__pycache__', '.git', '.vscode', 'node_modules'}


def is_valid_file(filename):
    """Check if file should be included in menu"""
    return any(filename.lower().endswith(ext) for ext in INCLUDE_EXTENSIONS)


def should_exclude_folder(folder_name):
    """Check if folder should be excluded from menu"""
    return folder_name.lower() in EXCLUDE_FOLDERS


def normalize_name(name):
    """Convert folder name to display name (underscore/dash to space)"""
    return name.replace('_', ' ').replace('-', ' ')


def build_menu_from_dir(directory_path):
    """
    Recursively build menu structure from directory.
    
    Returns:
        - List of filenames if directory has only files
        - Dict with subdirectories if directory has folders
        - Empty list if no valid content
    """
    items = {}
    files = []
    
    try:
        entries = sorted(os.listdir(directory_path))
    except PermissionError:
        return []
    
    # Process each entry in the directory
    for entry in entries:
        if should_exclude_folder(entry):
            continue
        
        full_path = os.path.join(directory_path, entry)
        
        if os.path.isdir(full_path):
            # Recursively process subdirectory
            sub_content = build_menu_from_dir(full_path)
            if sub_content:
                # Use normalized folder name as key
                folder_display_name = normalize_name(entry)
                items[folder_display_name] = sub_content
                
        elif os.path.isfile(full_path) and is_valid_file(entry):
            # Collect valid files
            files.append(entry)
    
    # Return appropriate structure based on what we found
    if items and files:
        # Both folders and files exist - merge them
        items['files'] = files
        return items
    elif items:
        # Only folders - return dict
        return items
    elif files:
        # Only files - return list
        return files
    else:
        # Nothing found
        return []


def finalize_menu_structure(structure):
    """
    Finalize menu structure by converting 'files' key appropriately
    """
    if isinstance(structure, list):
        return structure
    
    if not isinstance(structure, dict):
        return structure
    
    result = {}
    files_list = None
    
    # Process all entries except 'files'
    for key, value in structure.items():
        if key == 'files':
            files_list = value
        else:
            # Recursively finalize nested structures
            result[key] = finalize_menu_structure(value)
    
    # If we have files and subdirectories, merge them properly
    if files_list:
        if result:
            # Both files and folders exist - can't merge into single list
            # Keep structure as is (files will be added back)
            result['files'] = files_list
        else:
            # Only files at this level - return as list
            return files_list
    
    return result if result else []


def generate_menu_json():
    """
    Main function: Read courses folder and generate menu.json structure
    """
    if not os.path.exists(COURSES_DIR):
        print(f"❌ Error: Courses directory not found at {COURSES_DIR}")
        return False
    
    print(f"📂 Reading courses from: {COURSES_DIR}")
    print(f"📝 Generating menu structure...\n")
    
    menu_structure = {}
    
    try:
        # Read all top-level entries in courses folder
        entries = sorted(os.listdir(COURSES_DIR))
        
        for entry in entries:
            if should_exclude_folder(entry):
                print(f"   ⊘ Skipping: {entry}")
                continue
            
            full_path = os.path.join(COURSES_DIR, entry)
            
            if os.path.isdir(full_path):
                # Build menu structure from this category folder
                category_content = build_menu_from_dir(full_path)
                
                if category_content:
                    # Normalize category name
                    display_name = normalize_name(entry)
                    menu_structure[display_name] = category_content
                    print(f"   ✓ {display_name}")
        
        # Finalize the structure
        menu_structure = finalize_menu_structure(menu_structure)
        
        # Write to menu.json
        with open(MENU_OUTPUT, 'w', encoding='utf-8') as f:
            json.dump(menu_structure, f, indent=4, ensure_ascii=False)
        
        print(f"\n✅ Menu generated successfully!")
        print(f"📄 Output: {MENU_OUTPUT}")
        print(f"📊 Total categories: {len(menu_structure)}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error generating menu: {e}")
        return False


def print_menu_tree(content, indent=0, max_items=5):
    """Print menu structure as a tree for preview"""
    if isinstance(content, list):
        # Show file count
        count = len(content)
        display = ", ".join(content[:min(3, count)])
        if count > 3:
            display += f", ... +{count-3} more"
        print("  " * indent + f"📄 Files ({count}): {display}")
        return
    
    if not isinstance(content, dict):
        return
    
    keys = list(content.keys())
    for i, key in enumerate(keys):
        is_last = i == len(keys) - 1
        prefix = "└─ " if is_last else "├─ "
        
        value = content[key]
        
        if isinstance(value, list):
            count = len(value)
            print("  " * indent + prefix + f"📄 {key} ({count} files)")
        elif isinstance(value, dict):
            print("  " * indent + prefix + f"📁 {key}")
            print_menu_tree(value, indent + 1, max_items)


def main():
    """Main entry point"""
    print("\n" + "="*60)
    print("  🎓 EJAGRUTI MENU GENERATOR")
    print("="*60)
    
    # Generate menu
    if generate_menu_json():
        # Print preview
        print("\n📋 Menu Structure Preview:")
        print("-" * 60)
        try:
            with open(MENU_OUTPUT, 'r', encoding='utf-8') as f:
                menu = json.load(f)
            print_menu_tree(menu)
        except Exception as e:
            print(f"Could not load menu for preview: {e}")
    
    print("\n" + "="*60 + "\n")


if __name__ == '__main__':
    main()
