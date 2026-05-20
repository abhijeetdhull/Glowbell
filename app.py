import os
from functools import wraps

from flask import Flask, flash, redirect, render_template, request, session, url_for
from werkzeug.security import check_password_hash, generate_password_hash

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "change-this-secret")

# In a real app, replace this with a database.
users = {
    "demo": generate_password_hash("demo123")
}


def login_required(view):
    @wraps(view)
    def wrapped_view(**kwargs):
        if "username" not in session:
            return redirect(url_for("login"))
        return view(**kwargs)
    return wrapped_view


@app.context_processor
def inject_user():
    return {
        "logged_in": "username" in session,
        "username": session.get("username")
    }


@app.route("/")
def login():
    if "username" in session:
        return redirect(url_for("explore"))
    return render_template("login.html")


@app.route("/login", methods=["POST"])
def login_post():
    username = request.form.get("username", "").strip()
    password = request.form.get("password", "")

    if not username or not password:
        flash("Please enter both username and password.", "warning")
        return redirect(url_for("login"))

    password_hash = users.get(username)
    if password_hash and check_password_hash(password_hash, password):
        session["username"] = username
        flash(f"Welcome back, {username}!", "success")
        return redirect(url_for("explore"))

    flash("Invalid username or password.", "danger")
    return redirect(url_for("login"))


@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        password = request.form.get("password", "")
        confirm_password = request.form.get("confirm_password", "")

        if not username or not password:
            flash("Username and password are required.", "warning")
        elif password != confirm_password:
            flash("Passwords do not match.", "warning")
        elif username in users:
            flash("That username is already taken.", "warning")
        else:
            users[username] = generate_password_hash(password)
            flash("Account created successfully. Please log in.", "success")
            return redirect(url_for("login"))

    return render_template("register.html")


@app.route("/logout")
def logout():
    session.clear()
    flash("You have been logged out.", "info")
    return redirect(url_for("login"))


@app.route("/explore")
@login_required
def explore():
    return render_template("explore.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)
