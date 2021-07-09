import torch
import onnxruntime
import numpy as np
from PIL import Image
from io import BytesIO
from flask import Flask,request,jsonify,render_template
import os
import sys
import base64
import time

ort_session = onnxruntime.InferenceSession("onnx_model.onnx")

classes = {'0':'red', '1':'green', '2':'countdown_green', '3':'countdown_blank', '4':'none'}

app = Flask(__name__, static_url_path='/static')

@app.route('/')
def render_page():
	return render_template('index.html')

@app.route('/predict',methods=['POST'])
def predict():	
	image64 = request.json['image']
	image64 = image64.split(',')[1]
	im = Image.open(BytesIO(base64.b64decode(image64))).convert('RGB')
	
	w, h = 768, 576
	im = im.resize((w, h))
	
	pix = np.array(np.transpose(im, (2, 0, 1)))
	pix = torch.Tensor(pix).type(torch.FloatTensor)
	pix = pix.unsqueeze(0)
	pix = pix.view([1,-1,h,w])
	#start_time = time.time()
	ort_inputs = {ort_session.get_inputs()[0].name: pix.cpu().numpy()}
	ort_outputs = ort_session.run(None, ort_inputs)
	#print("--- %s seconds ---" % (time.time() - start_time), file=sys.stderr)

	pred_classes = ort_outputs[0][0]
	pred_direc = ort_outputs[1]
	predicted_id = str(np.where(pred_classes == np.amax(pred_classes))[0][0])
	points = pred_direc[0].tolist()
	
	return jsonify({ "class" : predicted_id, "points" : points })
    
if __name__ == '__main__':
    app.run(debug=False,port=os.getenv('PORT',5000))
