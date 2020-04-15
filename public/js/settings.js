/* global TrelloPowerUp */

var Promise = TrelloPowerUp.Promise;
var t = TrelloPowerUp.iframe();

var apikeySelector = document.getElementById('apikey');
var projectSelector = document.getElementById('project');

t.render(function () {
  return Promise.all([
    t.get('board', 'shared', 'apikey'),
    t.get('board', 'shared', 'project'),
  ])
    .spread(function (savedApiKey, savedProject) {
      apikeySelector.value = savedApiKey;
      projectSelector.value = savedProject;
    })
    .then(function () {
      t.sizeTo('#content').done();
    });
});

document.getElementById('save').addEventListener('click', function () {
  return t
    .set('board', 'shared', 'apikey', apikeySelector.value)
    .then(function () {
      return t.set('board', 'shared', 'project', projectSelector.value);
    })
    .then(function () {
      t.closePopup();
    });
});
