/* global TrelloPowerUp */

var Promise = TrelloPowerUp.Promise;
var t = TrelloPowerUp.iframe();

let savedRedirectUrl;

t.render(async function () {
  savedRedirectUrl = await t.get('board', 'private', 'redirecturl');
  t.sizeTo('#content').done();
});

document
  .getElementById('authorize')
  .addEventListener('click', async function () {
    window.open(savedRedirectUrl, '_blank');
    return t.closePopup();
  });
