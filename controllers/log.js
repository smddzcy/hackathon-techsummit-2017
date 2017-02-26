exports.getAddLog = (req, res) => {
  console.log(req.user);
  res.render('add-log', {
    title: 'Add Log'
  });
};

exports.getShowLogs = (req, res) => {
  res.render('logs', {
    title: 'Recent Logs'
  });
}
