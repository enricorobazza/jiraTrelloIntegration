// server.js
// where your node app starts
import compression from 'compression';
import cors from 'cors';
import express from 'express';

const app = express();

// compress our client side content before sending it over the wire
app.use(compression());

// your manifest must have appropriate CORS headers, you could also use '*'
app.use(cors({ origin: ['https://trello.com', 'http://localhost:58272'] }));

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

app.get('/authenticate', (req, res) => {
  if (req.query.link) {
    return res
      .status(200)
      .send(
        `<html><script>window.location.href="${req.query.link}"</script></html>`
      );
  } else if (req.query.code) return res.status(200).send(req.query.code);

  return res.status(404).send('Not found!');
});

// listen for requests :)
const listener = app.listen(process.env.PORT, function () {
  console.info(`Node Version: ${process.version}`);
  console.log(
    'Trello Power-Up Server listening on port ' + listener.address().port
  );
});
