import os
from PIL import Image
import hashlib
import shutil
from sklearn.model_selection import train_test_split

RAW_DIR = "Cows datasets"
CLEAN_DIR = "cleaned_dataset"
SPLITS = ["train", "val", "test"]

def get_image_hash(image_path):
    """Duplicate images identifier using MD5 hash."""
    with open(image_path, "rb") as f:
        return hashlib.md5(f.read()).hexdigest()

def clean_and_split_data(val_ratio=0.15, test_ratio=0.15):
    hashes = set()
    cleaned_images = {}  # {class_name: [valid_file_paths]}

    for class_name in os.listdir(RAW_DIR):
        class_path = os.path.join(RAW_DIR, class_name)
        if not os.path.isdir(class_path):
            continue
        
        cleaned_images[class_name] = []
        
        for img_name in os.listdir(class_path):
            img_path = os.path.join(class_path, img_name)
            
            # 1. Corrupted file check
            try:
                with Image.open(img_path) as img:
                    img.verify()  # Check if image is corrupted
            except Exception:
                print(f"[Corrupted Removed]: {img_path}")
                continue

            # 2. Duplicate check
            img_hash = get_image_hash(img_path)
            if img_hash in hashes:
                print(f"[Duplicate Removed]: {img_path}")
                continue
            
            hashes.add(img_hash)
            cleaned_images[class_name].append(img_path)

    # 3. Create Train / Val / Test Split
    for class_name, files in cleaned_images.items():
        train_files, test_files = train_test_split(files, test_size=(val_ratio + test_ratio), random_state=42)
        val_files, test_files = train_test_split(test_files, test_size=0.5, random_state=42)

        split_dict = {"train": train_files, "val": val_files, "test": test_files}

        for split_name, split_files in split_dict.items():
            dest_dir = os.path.join(CLEAN_DIR, split_name, class_name)
            os.makedirs(dest_dir, exist_ok=True)
            for f in split_files:
                shutil.copy(f, os.path.join(dest_dir, os.path.basename(f)))

    print("✅ Data Cleaning and Splitting Complete!")

if __name__ == "__main__":
    clean_and_split_data()