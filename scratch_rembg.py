
import sys
import base64
from io import BytesIO
from rembg import remove
from PIL import Image

# Read base64 from stdin or file
with open('/Users/eunju/Desktop/tatee_module/src/backend/public/uploads/WO-879576_primary_mockup_1786435879576_368.png', 'rb') as f:
    input_data = f.read()

output_data = remove(input_data)

with open('/Users/eunju/.gemini/antigravity/brain/e951246a-0b5f-4864-aa94-98b4975f378b/scratch/ai_rembg_white_tshirt.png', 'wb') as f:
    f.write(output_data)

print('AI REMBG SUCCESSFUL!')
