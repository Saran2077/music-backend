import querystring from 'querystring';

function generateRandomString(num) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < num; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

class Handler {
    async auth(req, res) {
        try {
            var state = generateRandomString(16);
            var scope = 'user-read-private user-read-email playlist-read-private playlist-read-collaborative user-library-read';

            const authUrl = 'https://accounts.spotify.com/authorize?' +
                querystring.stringify({
                    response_type: 'code',
                    client_id: process.env.SPOTIFY_CLIENT_ID,
                    scope: scope,
                    redirect_uri: process.env.SPOTIFY_REDIRECT_URL,
                    state: state
                });

            // Return the auth URL instead of redirecting
            res.status(200).json({
                status: true,
                data: {
                    authenticated: false,
                    authUrl: authUrl
                }
            });
        } catch (err) {
            console.log(`Error in spotify auth: ${err}`)
            res.status(500).json({
                status: false,
                message: `Internal Error: ${err.message}`
            })
        }
    }

    async authCallback(req, res) {
        try {
            var code = req.query.code || null;
            var state = req.query.state || null;

            if (state === null) {
                res.redirect('/#' +
                    querystring.stringify({
                        error: 'state_mismatch'
                    }));
            } else {
                var authOptions = {
                    url: 'https://accounts.spotify.com/api/token',
                    form: {
                        code: code,
                        redirect_uri: process.env.SPOTIFY_REDIRECT_URL,
                        grant_type: 'authorization_code'
                    },
                    headers: {
                        'content-type': 'application/x-www-form-urlencoded',
                        'Authorization': 'Basic ' + (Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64'))
                    },
                    json: true
                };

                // TODO: Make request to Spotify token endpoint
                // For now, just return success
                res.status(200).json({
                    status: true,
                    data: {
                        success: true,
                        message: 'Authentication successful'
                    }
                });
            }
        } catch (err) {
            console.log(`Error in spotify auth callback: ${err}`)
            res.status(500).json({
                status: false,
                message: `Internal Error: ${err.message}`
            })
        }
    }
}

export default Handler;