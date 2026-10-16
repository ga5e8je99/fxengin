
import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# Test Registration
url = 'https://core.fxengen.com/auth/register'
data = {
    'email': 'trader_vip@fxengin.com',
    'fullName': 'Tariq Al-Mansoor',
    'dateOfBirth': '1996-05-20',
    'password': 'SecureTrader2026!',
    'confirmPassword': 'SecureTrader2026!'
}

req = urllib.request.Request(url, data=json.dumps(data).encode(), headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req, context=ctx) as response:
        print('Register Status:', response.status)
        print('Register Response:', response.read().decode())
except urllib.error.HTTPError as e:
    print('Register HTTPError:', e.code, e.read().decode())

# Test Login
login_url = 'https://core.fxengen.com/auth/login'
login_data = {
    'email': 'trader_vip@fxengin.com',
    'password': 'SecureTrader2026!'
}
req_login = urllib.request.Request(login_url, data=json.dumps(login_data).encode(), headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req_login, context=ctx) as response:
        print('Login Status:', response.status)
        print('Login Response:', response.read().decode())
except urllib.error.HTTPError as e:
    print('Login HTTPError:', e.code, e.read().decode())

# Test Login with Wrong Password (Security check)
login_data_wrong = {
    'email': 'trader_vip@fxengin.com',
    'password': 'WrongPassword123!'
}
req_wrong = urllib.request.Request(login_url, data=json.dumps(login_data_wrong).encode(), headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req_wrong, context=ctx) as response:
        print('Wrong Password Status:', response.status)
except urllib.error.HTTPError as e:
    print('Wrong Password HTTPError (Expected 401):', e.code, e.read().decode())

# Test Login with Non-Existent User
login_data_fake = {
    'email': 'nonexistent_user@fxengin.com',
    'password': 'SomePassword123!'
}
req_fake = urllib.request.Request(login_url, data=json.dumps(login_data_fake).encode(), headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req_fake, context=ctx) as response:
        print('Fake User Status:', response.status)
except urllib.error.HTTPError as e:
    print('Fake User HTTPError (Expected 401):', e.code, e.read().decode())
