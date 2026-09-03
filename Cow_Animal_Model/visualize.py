import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from PIL import Image

# Path Setup
TRAIN_DIR = "cleaned_dataset/train"

# Check if train directory exists
if not os.path.exists(TRAIN_DIR):
    print(f"Error: Path '{TRAIN_DIR}' does not exist! Please check dataset path.")
    exit()

classes = [d for d in os.listdir(TRAIN_DIR) if os.path.isdir(os.path.join(TRAIN_DIR, d))]

# Global Plot Styling
sns.set_theme(style="whitegrid")
plt.rcParams.update({'font.size': 11})

print("Generating Visualizations...")

# ==========================================
# 1. CLASS DISTRIBUTION CHART
# ==========================================
class_counts = {c: len(os.listdir(os.path.join(TRAIN_DIR, c))) for c in classes}

plt.figure(figsize=(10, 5))
ax = sns.barplot(x=list(class_counts.keys()), y=list(class_counts.values()), palette="crest")
plt.title("1. Dataset Class Distribution (Train Set)", fontsize=14, fontweight='bold')
plt.xlabel("Livestock Condition / Disease")
plt.ylabel("Number of Images")

for p in ax.patches:
    ax.annotate(f'{int(p.get_height())}', (p.get_x() + p.get_width() / 2., p.get_height()),
                ha='center', va='center', xytext=(0, 5), textcoords='offset points')

plt.xticks(rotation=15)
plt.tight_layout()
plt.show()

# ==========================================
# 2. SAMPLE IMAGES DISPLAY (3 Images per Class)
# ==========================================
fig, axes = plt.subplots(len(classes), 3, figsize=(12, 3.5 * len(classes)))
fig.suptitle("2. Sample Images per Class", fontsize=16, fontweight='bold', y=0.99)

for i, c in enumerate(classes):
    c_dir = os.path.join(TRAIN_DIR, c)
    img_names = [f for f in os.listdir(c_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))][:3]
    
    for j, img_name in enumerate(img_names):
        img_path = os.path.join(c_dir, img_name)
        img = Image.open(img_path)
        
        ax = axes[i, j] if len(classes) > 1 else axes[j]
        ax.imshow(img)
        ax.set_title(f"{c}\n({img.size[0]}x{img.size[1]})", fontsize=10)
        ax.axis('off')

plt.tight_layout()
plt.show()

# ==========================================
# 3. DATASET SPLIT SUMMARY TABLE
# ==========================================
data_summary = []
for c in classes:
    train_c = len(os.listdir(f"cleaned_dataset/train/{c}")) if os.path.exists(f"cleaned_dataset/train/{c}") else 0
    val_c = len(os.listdir(f"cleaned_dataset/val/{c}")) if os.path.exists(f"cleaned_dataset/val/{c}") else 0
    test_c = len(os.listdir(f"cleaned_dataset/test/{c}")) if os.path.exists(f"cleaned_dataset/test/{c}") else 0
    data_summary.append({
        "Class": c,
        "Train": train_c,
        "Validation": val_c,
        "Test": test_c,
        "Total": train_c + val_c + test_c
    })

df_summary = pd.DataFrame(data_summary)
print("\n=== 3. Dataset Split Statistics ===")
print(df_summary.to_string(index=False))

# ==========================================
# DATA SAMPLING FOR ADVANCED PLOTS
# ==========================================
widths, heights = [], []
aspect_ratios = []
r_means, g_means, b_means = [], [], []
brightness_list = []

for c in classes:
    c_dir = os.path.join(TRAIN_DIR, c)
    img_files = [f for f in os.listdir(c_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg'))][:40]
    
    for img_name in img_files:
        img_path = os.path.join(c_dir, img_name)
        with Image.open(img_path).convert('RGB') as img:
            w, h = img.size
            widths.append(w)
            heights.append(h)
            aspect_ratios.append(w / h)
            
            arr = np.array(img)
            r_means.append(arr[:, :, 0].mean())
            g_means.append(arr[:, :, 1].mean())
            b_means.append(arr[:, :, 2].mean())
            brightness_list.append(arr.mean())

# ==========================================
# 4. IMAGE DIMENSIONS SCATTER PLOT
# ==========================================
plt.figure(figsize=(8, 5))
plt.scatter(widths, heights, alpha=0.6, color='teal', edgecolors='w', s=70)
plt.axvline(224, color='red', linestyle='--', label='Target Width (224px)')
plt.axhline(224, color='red', linestyle='--', label='Target Height (224px)')
plt.title("4. Image Resolutions Scatter Plot", fontsize=14, fontweight='bold')
plt.xlabel("Original Width (px)")
plt.ylabel("Original Height (px)")
plt.legend()
plt.tight_layout()
plt.show()

# ==========================================
# 5. ASPECT RATIO DISTRIBUTION
# ==========================================
plt.figure(figsize=(8, 4))
sns.histplot(aspect_ratios, kde=True, color="purple", bins=20)
plt.axvline(1.0, color="red", linestyle="--", label="Square Ratio (1:1)")
plt.title("5. Image Aspect Ratio Distribution", fontsize=14, fontweight="bold")
plt.xlabel("Aspect Ratio (Width / Height)")
plt.ylabel("Image Count")
plt.legend()
plt.tight_layout()
plt.show()

# ==========================================
# 6. RGB COLOR CHANNEL MEANS
# ==========================================
plt.figure(figsize=(7, 4))
channels = ["Red", "Green", "Blue"]
means = [np.mean(r_means), np.mean(g_means), np.mean(b_means)]
colors = ["#e74c3c", "#2ecc71", "#3498db"]

sns.barplot(x=channels, y=means, palette=colors)
plt.title("6. Mean RGB Channel Pixel Intensity", fontsize=14, fontweight="bold")
plt.ylabel("Average Pixel Value (0-255)")
plt.ylim(0, 255)
plt.tight_layout()
plt.show()

# ==========================================
# 7. IMAGE BRIGHTNESS DISTRIBUTION
# ==========================================
plt.figure(figsize=(8, 4))
sns.boxplot(x=brightness_list, color="#FFBF00")  # Fixed Hex Color Code
plt.title("7. Dataset Image Brightness Level", fontsize=14, fontweight="bold")
plt.xlabel("Average Brightness Value (0 = Dark, 255 = Bright)")
plt.tight_layout()
plt.show()

print("✅ All Visualizations Completed Successfully!")