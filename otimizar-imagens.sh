#!/usr/bin/env bash
# Converte JPG/PNG de img/originais/ para WebP em img/ (máx. 800px de largura, qualidade 80).
# Uso: bash otimizar-imagens.sh
# Requer: cwebp (libwebp) OU Node.js (usa npx sharp-cli).
# Obs.: og.jpg NÃO é convertido (redes sociais exigem JPG); coloque-o direto em img/.

set -euo pipefail
cd "$(dirname "$0")"

ORIG="img/originais"
DEST="img"
LARGURA=800
QUALIDADE=80

if [ ! -d "$ORIG" ]; then
  echo "Pasta $ORIG não encontrada. Crie-a e coloque os JPG/PNG lá."
  exit 1
fi

shopt -s nullglob nocaseglob
arquivos=("$ORIG"/*.jpg "$ORIG"/*.jpeg "$ORIG"/*.png)
shopt -u nocaseglob

if [ ${#arquivos[@]} -eq 0 ]; then
  echo "Nenhum JPG/PNG em $ORIG."
  exit 0
fi

# Largura da imagem (para não ampliar imagens menores que 800px)
largura() {
  if command -v identify >/dev/null 2>&1; then
    identify -format "%w" "$1[0]" 2>/dev/null
  elif command -v python3 >/dev/null 2>&1; then
    python3 -c "import sys; from PIL import Image; print(Image.open(sys.argv[1]).width)" "$1" 2>/dev/null || echo 99999
  else
    echo 99999   # desconhecida: assume grande e redimensiona
  fi
}

if command -v cwebp >/dev/null 2>&1; then
  MODO="cwebp"
elif command -v npx >/dev/null 2>&1; then
  MODO="sharp"
else
  echo "Instale o cwebp (https://developers.google.com/speed/webp/download) ou o Node.js."
  exit 1
fi
echo "Usando: $MODO"

for f in "${arquivos[@]}"; do
  nome="$(basename "${f%.*}")"
  if [ "$(echo "$nome" | tr '[:upper:]' '[:lower:]')" = "og" ]; then
    echo "Pulando $f (og.jpg fica em JPG)"; continue
  fi
  saida="$DEST/$nome.webp"

  if [ "$MODO" = "cwebp" ]; then
    w="$(largura "$f")"
    if [ "${w:-99999}" -gt "$LARGURA" ]; then
      cwebp -quiet -q "$QUALIDADE" -resize "$LARGURA" 0 "$f" -o "$saida"
    else
      cwebp -quiet -q "$QUALIDADE" "$f" -o "$saida"
    fi
  else
    npx --yes sharp-cli -i "$f" -o "$saida" -f webp -q "$QUALIDADE" resize "$LARGURA" --withoutEnlargement
  fi
  echo "✔ $f → $saida"
done

echo "Pronto. Confira se os nomes batem com os usados no index.html (ex.: capa-matematica.webp)."
