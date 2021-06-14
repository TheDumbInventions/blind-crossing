window.onload = function(){ 
const video = document.getElementById("camera");
const canvas = window.canvas = document.getElementById("videoCanvas");
const canvas_ctx = canvas.getContext('2d');
const result = document.getElementById("result");

const yellow_sound = new Audio('./static/js/audio/giallo.mp3');
const red_sound = new Audio('./static/js/audio/rosso.mp3');
const forward_sound = new Audio('./static/js/audio/dritto.mp3');
const dx_sound = new Audio('./static/js/audio/destra.mp3');
const sx_sound = new Audio('./static/js/audio/sinistra.mp3');
const classes = ['red', 'green', 'countdown_green', 'countdown_blank', 'none'];

const SEM_AVG = 10;
const POINTS_AVG = 5;

var points_buff = zeros(POINTS_AVG, 4);
var points = [0, 0, 0, 0];
var sem_rec = [0, 0, 0, 0, 0];
var sem = 0;
var sem_iter = SEM_AVG-1;
var points_iter = 0;

canvas.width = 768;
canvas.height = 576;

video.onplay = function() {
  setTimeout(updateRequest, 300);
};

function updateDirection() {
  canvas.width = video.offsetWidth;
  canvas.height = video.offsetHeight;
  canvas_ctx.strokeStyle = "#FF0000";
  canvas_ctx.lineWidth = 5;
  canvas_ctx.beginPath();
  canvas_ctx.moveTo(points[0]*canvas.width, points[1]*canvas.height);
  canvas_ctx.lineTo(points[2]*canvas.width, points[3]*canvas.height);
  canvas_ctx.stroke();
  /*
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
  */
  
  if(points[0] < 0.4){
  	sx_sound.play();
  }else if(points[0] > 0.6){
  	dx_sound.play();
  }else{
  	forward_sound.play();
  }

  //setTimeout(updateRequest , 50);
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
       sem_rec[data['class']] += 1;
       if(sem_iter < SEM_AVG-1){
         sem_iter++;
       }
       else
       {
         sem_iter = 0;
  		 sem = sem_rec.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
  		 result.textContent = classes[sem];
  		 console.log(sem_rec);
  		 sem_rec = [0, 0, 0, 0, 0];
       }
       
       points_buff[points_iter] = data['points'];
       if(points_iter < POINTS_AVG-1){
         points_iter++;
       }
       else
       {
         points_iter = 0;
         points = [0, 0, 0, 0];
         //console.log(points_buff);
         var i;
		 for (i = 0; i < POINTS_AVG; i++) {
  		    points[0] += points_buff[i][0];
  		    points[1] += points_buff[i][1];
  		    points[2] += points_buff[i][2];
  		    points[3] += points_buff[i][3];
		 }
		 points[0] /= POINTS_AVG;
  		 points[1] /= POINTS_AVG;
  		 points[2] /= POINTS_AVG;
  		 points[3] /= POINTS_AVG;
  		 
  		 if(sem == 0){
  		 	red_sound.play();
  		 }
  		 else if(sem == 3){
         	yellow_sound.play();
         	updateDirection();
         }
         else {
         	updateDirection();
         }
       }
       
       updateRequest();
       //result.textContent = classes[data['class']];
       //console.log(data['class']);
    }
  })
}

function zeros(dimensions) {
    var array = [];

    for (var i = 0; i < dimensions[0]; ++i) {
        array.push(dimensions.length == 1 ? 0 : zeros(dimensions.slice(1)));
    }

    return array;
}

const constraints = {
  audio: false,
/*
  video: {
    facingMode: {
      exact: 'environment'
    }
  }
  */
  video: true
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
