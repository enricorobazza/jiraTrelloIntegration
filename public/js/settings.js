/* global TrelloPowerUp */

var Promise = TrelloPowerUp.Promise;
var t = TrelloPowerUp.iframe();

var linkSelector = document.getElementById('link');
var projectSelector = document.getElementById('project');

t.render(function () {
  return Promise.all([
    t.get('board', 'shared', 'link'),
    t.get('board', 'shared', 'project'),
  ])
    .spread(function (savedLink, savedProject) {
      if (savedLink) linkSelector.value = savedLink;
      else linkSelector.value = 'https://icmcjunior.atlassian.net/';
      if (savedProject) projectSelector.value = savedProject;
    })
    .then(function () {
      t.sizeTo('#content').done();
    });
});

document.getElementById('save').addEventListener('click', async function () {
  return t.set('board', 'shared', 'lastUpdated', Date.now()).then(function () {
    return t
      .set('board', 'shared', 'link', linkSelector.value)
      .then(function () {
        return t
          .set('board', 'shared', 'project', projectSelector.value)
          .then(function () {
            t.closePopup();
          });
      });
  });
});
