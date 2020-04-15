/* global TrelloPowerUp */

var Promise = TrelloPowerUp.Promise;
var t = TrelloPowerUp.iframe();

var emailSelector = document.getElementById('email');
var apikeySelector = document.getElementById('apikey');
var projectSelector = document.getElementById('project');

t.render(function () {
  return Promise.all([
    t.get('board', 'shared', 'email'),
    t.get('board', 'shared', 'apikey'),
    t.get('board', 'shared', 'project'),
  ])
    .spread(function (savedEmail, savedApiKey, savedProject) {
      apikeySelector.value = savedApiKey;
      projectSelector.value = savedProject;
      emailSelector.value = savedEmail;
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
      return t
        .set('board', 'shared', 'email', emailSelector.value)
        .then(function () {
          t.closePopup();
        });
    });
});
