if($('#map').length > 0){
  $(document).ready(function() {
    $.ajax({
      url: '/logs',
      type: 'GET'
    })
    .done(function(data) {
      var heatMapData = data.map(function(el) {
        return {
          location: new google.maps.LatLng(el.location.latitude, el.location.longitude),
          weight: el.weight * 3.5
        };
      });

      var istanbul = new google.maps.LatLng(41.0800543, 29.0211917);

      map = new google.maps.Map(document.getElementById('map'), {
        center: istanbul,
        zoom: 13,
        mapTypeId: 'satellite'
      });

      var heatmap = new google.maps.visualization.HeatmapLayer({
        data: heatMapData,
        radius: 20
      });

      heatmap.setMap(map);
    });
  });

}
var logs = $("#logs");
if(logs.length > 0) {
  logs.html('');
  var getEl = function(data, i) {
    var el = '<div class="title" style="margin-bottom:0">'
      + '<h4 style="margin-bottom:0">Time: <b>' + new Date(parseInt(data.time))
      + '</b></h4></div>';
    el += '<div id="map'+i+'" style="height: 200px"></div>'
    return $(el);
  };

  $.ajax({
      url: '/logs',
      type: 'GET'
  })
  .done(function(data) {
    data.sort((a, b) => a.time > b.time ? -1 : 1);

    for(var i in data) {
      var el = getEl(data[i], i);
      logs.append(el);

      var loc = new google.maps.LatLng(data[i].location.latitude, data[i].location.longitude);

      var map = new google.maps.Map(document.getElementById('map' + i), {
        center: loc,
        zoom: 15,
        mapTypeId: 'satellite',
        scrollWheel: false
      });

      new google.maps.Marker({
        position: loc,
        map: map,
        title: 'Logged on ' + new Date(parseInt(data[i].time))
      });
    }
  });
}
