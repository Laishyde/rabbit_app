"""
Simple Asset Extractor - Recorta áreas específicas da imagem de assets
Usa coordenadas manuais ou grade para extrair assets
"""

import cv2
import numpy as np
from PIL import Image
import os

INPUT_DIR = "input"
OUTPUT_DIR = "output"

def extract_grid_assets(image_path, output_dir, grid_rows=3, grid_cols=4, padding=10):
    """
    Extrai assets dividindo a imagem em uma grade
    
    Args:
        image_path: Caminho da imagem original
        output_dir: Diretório de saída
        grid_rows: Número de linhas na grade
        grid_cols: Número de colunas na grade
        padding: Padding em pixels ao redor de cada asset
    """
    # Carregar imagem
    image = cv2.imread(image_path)
    if image is None:
        print(f"Erro ao carregar imagem: {image_path}")
        return
    
    h, w = image.shape[:2]
    
    # Calcular tamanho de cada célula
    cell_h = h // grid_rows
    cell_w = w // grid_cols
    
    print(f"Imagem: {w}x{h}")
    print(f"Células: {cell_w}x{cell_h}")
    
    # Extrair cada célula
    for row in range(grid_rows):
        for col in range(grid_cols):
            # Calcular coordenadas
            x_start = max(0, col * cell_w - padding)
            y_start = max(0, row * cell_h - padding)
            x_end = min(w, (col + 1) * cell_w + padding)
            y_end = min(h, (row + 1) * cell_h + padding)
            
            # Recortar
            cropped = image[y_start:y_end, x_start:x_end]
            
            # Converter para RGBA
            rgba = cv2.cvtColor(cropped, cv2.COLOR_BGR2RGBA)
            
            # Salvar
            output_path = os.path.join(output_dir, f"asset_{row}_{col}.png")
            pil_image = Image.fromarray(rgba)
            pil_image.save(output_path, 'PNG')
            print(f"Salvo: {output_path}")

def extract_specific_regions(image_path, output_dir, regions):
    """
    Extrai regiões específicas baseadas em coordenadas
    
    Args:
        image_path: Caminho da imagem original
        output_dir: Diretório de saída
        regions: Lista de tuplas (name, x, y, width, height)
    """
    # Carregar imagem
    image = cv2.imread(image_path)
    if image is None:
        print(f"Erro ao carregar imagem: {image_path}")
        return
    
    h, w = image.shape[:2]
    print(f"Imagem: {w}x{h}")
    
    for name, x, y, width, height in regions:
        # Recortar
        cropped = image[y:y+height, x:x+width]
        
        # Converter para RGBA
        rgba = cv2.cvtColor(cropped, cv2.COLOR_BGR2RGBA)
        
        # Salvar
        output_path = os.path.join(output_dir, f"{name}.png")
        pil_image = Image.fromarray(rgba)
        pil_image.save(output_path, 'PNG')
        print(f"Salvo: {output_path}")

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Encontrar imagem de entrada
    image_files = [f for f in os.listdir(INPUT_DIR) if f.endswith(('.png', '.jpg', '.jpeg'))]
    
    if not image_files:
        print(f"Nenhuma imagem encontrada em {INPUT_DIR}")
        return
    
    image_path = os.path.join(INPUT_DIR, image_files[0])
    print(f"Processando: {image_path}")
    
    # Carregar imagem para ver tamanho
    image = cv2.imread(image_path)
    h, w = image.shape[:2]
    print(f"Tamanho da imagem: {w}x{h}")
    
    # Definir regiões específicas baseadas na imagem original
    # Estas coordenadas precisam ser ajustadas baseadas na sua imagem
    regions = [
        # Coelho frames (c-1 a c-9)
        ("c-1", 100, 100, 200, 200),
        ("c-2", 350, 100, 200, 200),
        ("c-3", 600, 100, 200, 200),
        ("c-4", 850, 100, 200, 200),
        ("c-5", 100, 350, 200, 200),
        ("c-6", 350, 350, 200, 200),
        ("c-7", 600, 350, 200, 200),
        ("c-8", 850, 350, 200, 200),
        ("c-9", 100, 600, 200, 200),
        
        # Outros assets
        ("coruja", 350, 600, 200, 200),
        ("cenoura", 600, 600, 200, 200),
        ("margarida", 850, 600, 200, 200),
        ("arvore", 100, 850, 200, 200),
        ("rio", 350, 850, 200, 200),
        ("tronco", 600, 850, 200, 200),
        ("pedras", 850, 850, 200, 200),
    ]
    
    # Ajustar regiões baseado no tamanho real da imagem
    scale_x = w / 1100  # Assumindo que a imagem original tem ~1100px de largura
    scale_y = h / 1100  # Assumindo que a imagem original tem ~1100px de altura
    
    adjusted_regions = []
    for name, x, y, width, height in regions:
        adj_x = int(x * scale_x)
        adj_y = int(y * scale_y)
        adj_w = int(width * scale_x)
        adj_h = int(height * scale_y)
        adjusted_regions.append((name, adj_x, adj_y, adj_w, adj_h))
    
    print(f"\nRegiões ajustadas para tamanho {w}x{h}:")
    for name, x, y, width, height in adjusted_regions:
        print(f"  {name}: ({x}, {y}, {width}x{height})")
    
    extract_specific_regions(image_path, OUTPUT_DIR, adjusted_regions)
    print(f"\nExtração completa! Imagens salvas em {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
