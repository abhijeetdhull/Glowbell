# Glowbell

## Flask Web App

Glowbell is now a Flask-based web app with login support.
It serves the city explorer UI from the browser and supports a future backend for authentication and payments.

## Run locally

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Set a secret key and start the app:

```bash
export SECRET_KEY="your-secret-key"
python app.py
```

3. Open the app in your browser:

```text
http://127.0.0.1:5000
```

4. Sign in with the demo account:

- username: `demo`
- password: `demo123`

## Files

- `app.py` — Flask backend routes and login flow
- `templates/` — HTML templates for login, register, and the explorer page
- `static/css/styles.css` — styles for the full app
- `static/js/script.js` — city search, weather, photo, and tourist spot logic
- `requirements.txt` — Python dependencies
- `Procfile` — Render-compatible startup command

## Deploying to Render

1. Create a new Python Web Service on Render.
2. Connect your repository.
3. Set the `Build Command` to:

```bash
pip install -r requirements.txt
```

4. Set the `Start Command` to:

```bash
gunicorn app:app
```

5. Add the environment variable:

- `SECRET_KEY` = a strong random string

6. Deploy.

## Notes

- This app now supports user login through Flask sessions.
- Payment gateway integration can be added later as server-side routes.
