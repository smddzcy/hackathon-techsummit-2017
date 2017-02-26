// The data used for this example was pulled from
// http://archive.ics.uci.edu/ml/datasets/Automobile

var fs = require('fs'),
    LinearRegression = require('shaman').LinearRegression;

var X = [[40.824917360323, 29.5812931, 2016072639], [40.00476749862282, 29.861034, 2016072466], [41.469583237834485, 29.31583149, 2016073182]];
var y = [0.5,0.4,0.8];

// Initialize and train the linear regression
var lr = new LinearRegression(X, y, {algorithm: 'GradientDescent'});
lr.train(function(err) {
  if (err) {
    console.log('error', err);
    process.exit(2);
  }

  // Use the linear regression function to get a set of data to graph the linear regression line
  var y2 = [];
  X.forEach(function(xi) {
    y2.push(lr.predict(xi));
  });

  console.log(y2);
});
