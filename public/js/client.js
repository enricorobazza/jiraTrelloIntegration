var Promise = TrelloPowerUp.Promise;

var GRAY_ICON =
  'https://cdn.hyperdev.com/us-east-1%3A3d31b21c-01a0-4da2-8827-4bc6e88b7618%2Ficon-gray.svg';
var LAMP_ICON = './resources/lamp.svg';

var showAuthorization = (t, options) => {
  // Returns what to do when a user clicks the 'Authorize Account' link from the Power-Up gear icon
  // which shows when 'authorization-status' returns { authorized: false }.

  // If we want to ask the user to authorize our Power-Up to make full use of the Trello API
  // you'll need to add your API from trello.com/app-key below:
  let trelloAPIKey = 'ebb9bec74b8c5f3fc92e50792f84aca3';
  // This key will be used to generate a token that you can pass along with the API key to Trello's
  // RESTful API. Using the key/token pair, you can make requests on behalf of the authorized user.

  // In this case we'll open a popup to kick off the authorization flow.
  if (trelloAPIKey) {
    return t.popup({
      title: 'Autorizar',
      args: { apiKey: trelloAPIKey }, // Pass in API key to the iframe
      url: './authorize.html', // Check out public/authorize.html to see how to ask a user to auth
      height: 180,
    });
  } else {
    console.log('🙈 Looks like you need to add your API key to the project!');
  }
};

var boardButtonCallback = function (t) {
  return t.popup({
    title: 'Jira Sync',
    items: [
      {
        text: 'Sincronizar últimas tarefas',
        icon: LAMP_ICON,
        callback: async (tr) => {
          const token = await tr.get('member', 'private', 'token');

          if (!token) return showAuthorization(tr);

          const savedLink = await t.get('board', 'shared', 'link');
          const savedProject = await t.get('board', 'shared', 'project');
          const lastUpdated = await t.get('board', 'shared', 'lastUpdated');
          try {
            const response = await axios.get(
              `https://jiratrellointegration.herokuapp.com/token/${encodeURIComponent(
                savedLink
              )}?project="${savedProject}"&lastUpdated=${lastUpdated}`
            );
            if (response.data.redirect) {
              return tr
                .set('board', 'private', 'redirecturl', response.data.url)
                .then(() => {
                  return tr.popup({
                    title: 'Autorizar',
                    url: './authorize_jira.html',
                    height: 164,
                  });
                });
            }
            const issues = response.data;
            const apiKey = 'ebb9bec74b8c5f3fc92e50792f84aca3';

            return tr.lists('all').then((lists) => {
              const filteredLists = lists.filter(
                (list) => list.name.toLowerCase() === 'sprint backlog'
              );

              if (filteredLists.length === 0) {
                alert('Crie uma lista chamada Sprint Backlog!!');
                return tr.closePopup();
              }

              const sprintBacklogList = filteredLists[0];

              const promises = [];
              issues.forEach((issue) => {
                promises.push(
                  axios.post(
                    `https://api.trello.com/1/cards?key=${apiKey}&token=${token}&name=[${issue.key}] ${issue.title}&pos=top&idList=${sprintBacklogList.id}`
                  )
                );
              });

              Promise.all(promises)
                .then((results) => {
                  return tr
                    .set('board', 'shared', 'lastUpdated', Date.now())
                    .then(() => {
                      return tr.closePopup();
                    });
                })
                .catch((err) => {
                  //// TOKEN EXPIRED
                  alert('Por favor recarregue a página e autorize o power up.');
                  return tr.set('member', 'private', 'token', null).then(() => {
                    return showAuthorization();
                  });
                });
            });
          } catch (err) {
            alert('Erro ao carregar!');
            return tr.closePopup();
          }
        },
      },
      {
        text: 'Configurações',
        icon: LAMP_ICON,
        callback: (tr) =>
          tr.popup({
            // Callback to be called when user clicks the action button.
            title: 'Configurações',
            url: './settings.html',
            height: 164,
          }),
      },
    ],
  });
};

TrelloPowerUp.initialize(
  {
    // NOTE about asynchronous responses
    // If you need to make an asynchronous request or action before you can reply to Trello
    // you can return a Promise (bluebird promises are included at TrelloPowerUp.Promise)
    // The Promise should resolve to the object type that is expected to be returned
    'board-buttons': function (t, options) {
      return [
        {
          // we can either provide a button that has a callback function
          // that callback function should probably open a popup, overlay, or boardBar
          icon: LAMP_ICON,
          text: 'Jira Sync',
          condition: 'always',
          callback: boardButtonCallback,
        },
      ];
    },
    // 'show-settings': function (t, options) {
    //   // when a user clicks the gear icon by your Power-Up in the Power-Ups menu
    //   // what should Trello show. We highly recommend the popup in this case as
    //   // it is the least disruptive, and fits in well with the rest of Trello's UX
    //   return t.popup({
    //     title: 'Configurações',
    //     url: './settings.html',
    //     height: 184, // we can always resize later, but if we know the size in advance, its good to tell Trello
    //   });
    // },
    'card-buttons': function (t, opts) {
      return [
        {
          // usually you will provide a callback function to be run on button click
          // we recommend that you use a popup on click generally
          icon: LAMP_ICON, // don't use a colored icon here
          text: 'Story Points',
          callback: (tr) => {
            return tr
              .card('id')
              .get('id')
              .then((id) => {
                return tr.popup({
                  title: 'Story Points',
                  args: { id }, // Pass in API key to the iframe
                  url: './storypoints.html', // Check out public/authorize.html to see how to ask a user to auth
                  height: 180,
                });
              });
          },
          condition: 'edit',
        },
      ];
    },

    'card-badges': function (t, opts) {
      let cardAttachments = opts.attachments; // Trello passes you the attachments on the card
      return t
        .card('id')
        .get('id')
        .then(async function (cardId) {
          const storyPoints = await t.get('board', 'shared', cardId);
          if (storyPoints)
            return [
              {
                // It's best to use static badges unless you need your
                // badges to refresh.
                // You can mix and match between static and dynamic
                text: `CARD ID: ${cardId}`,
                icon: LAMP_ICON, // for card front badges only
                color: 'blue',
              },
            ];
          else return [];
        });
    },

    /*        
      
      🔑 Authorization Capabiltiies 🗝
      
      The following two capabilities should be used together to determine:
      1. whether a user is appropriately authorized
      2. what to do when a user isn't completely authorized
      
  */
    'authorization-status': function (t, options) {
      // Return a promise that resolves to an object with a boolean property 'authorized' of true or false
      // The boolean value determines whether your Power-Up considers the user to be authorized or not.

      // When the value is false, Trello will show the user an "Authorize Account" options when
      // they click on the Power-Up's gear icon in the settings. The 'show-authorization' capability
      // below determines what should happen when the user clicks "Authorize Account"

      // For instance, if your Power-Up requires a token to be set for the member you could do the following:
      return (
        t
          .get('member', 'private', 'token')
          // Or if you needed to set/get a non-Trello secret token, like an oauth token, you could
          // use t.storeSecret('key', 'value') and t.loadSecret('key')
          .then(function (token) {
            if (token) {
              return { authorized: true };
            }
            return { authorized: false };
          })
      );
      // You can also return the object synchronously if you know the answer synchronously.
    },
    'show-authorization': showAuthorization,
  },
  {
    appKey: 'your_key_here',
    appName: 'JiraTrelloIntegration',
  }
);
