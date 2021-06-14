window.onload = function(){ 
const video = document.getElementById("camera");
const canvas = window.canvas = document.getElementById("videoCanvas");
const canvas_ctx = canvas.getContext('2d');
const result = document.getElementById("result");

const forward_sound = new Audio('./static/js/audio/dritto.mp3');
const dx_sound = new Audio('./static/js/audio/destra.mp3');
const sx_sound = new Audio('./static/js/audio/sinistra.mp3');
const classes = ['red', 'green', 'countdown_green', 'countdown_blank', 'none'];

canvas.width = 768;
canvas.height = 576;

video.onplay = function() {
  setTimeout(updateRequest, 300);
};

function updateDirection(points) {
  canvas.width = video.offsetWidth;
  canvas.height = video.offsetHeight;
  canvas_ctx.strokeStyle = "#FF0000";
  canvas_ctx.lineWidth = 5;
  canvas_ctx.beginPath();
  canvas_ctx.moveTo(points[0]*canvas.width, points[1]*canvas.height);
  canvas_ctx.lineTo(points[2]*canvas.width, points[3]*canvas.height);
  canvas_ctx.stroke();
  var m = (canvas.height/canvas.width) * (points[3] - points[1])/(points[2] - points[0]);
  if(m < 8 && m > 0){
  	sx_sound.play();
  }else if(m > -8 && m < 0){
  	dx_sound.play();
  }
  else if(m > -1000 && m < 0){
  	//forward_sound.play();
  }
  else if(m < 1000 && m < 0){
  	//forward_sound.play();
  }
  //console.log(m);
  setTimeout(updateRequest , 50);
}

function updateRequest() {
  //event.preventDefault();
  var tmpcanvas = document.createElement('canvas');
  tmpcanvas.width = video.videoWidth;
  tmpcanvas.height = video.videoHeight;
  tmpcanvas.getContext('2d').drawImage(video, 0, 0, tmpcanvas.width, tmpcanvas.height);
  var image = tmpcanvas.toDataURL('image/jpeg');
  $.ajax({
    type: 'POST',
    url: '/predict',
    data: JSON.stringify({"image": image}),
    dataType: "json",
    contentType: "application/json",
    cache: false,
    processData: false,
    success: function(data) {
       updateDirection(data['points']);
       result.textContent = classes[data['class']];
       //console.log(data['class']);
    }
  })
}

const constraints = {
  audio: false,

  video: {
    facingMode: {
      exact: 'environment'
    }
  }
  
  //video: true
};

function handleSuccess(stream) {
  window.stream = stream; // make stream available to browser console
  video.srcObject = stream;
}

function handleError(error) {
  console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
}

navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess).catch(handleError);
}
