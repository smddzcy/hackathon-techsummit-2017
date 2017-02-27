import tensorflow as tf
import numpy as np

features = [tf.contrib.layers.real_valued_column("lat", dimension=1),
            tf.contrib.layers.real_valued_column("lng", dimension=1),
            tf.contrib.layers.real_valued_column("time", dimension=1)]

estimator = tf.contrib.learn.LinearRegressor(feature_columns=features)

lat = np.array([40.824917360323,40.00476749862282,41.469583237834485])
lng = np.array([40.824917360323,40.00476749862282,41.469583237834485])
time = np.array([1,2,3])
y = np.array([0.1, 0.5, 0.7])

input_fn = tf.contrib.learn.io.numpy_input_fn({
    "lat": lat,
    "lng": lng,
    "time": time
    }, y, batch_size=4, num_epochs=1000)

estimator.fit(input_fn=input_fn, steps=1000)

print estimator.evaluate(input_fn=input_fn)

