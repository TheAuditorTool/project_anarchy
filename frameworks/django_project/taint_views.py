"""
Django Taint Flow Views

These views demonstrate cross-boundary taint flows from Angular frontend.
Each view has a clear Source → Sink path for taint analysis testing.

TAINT FLOWS:
1. /api/users/search - SQL Injection (query → cursor.execute)
2. /api/users/:id - IDOR (userId → model lookup without auth)
3. /api/users/:id/avatar - Path Traversal (path → open())
4. /api/admin/exec - Command Injection (command → os.system)
5. /api/users/:id/notification - SSTI (template → Template.render)
6. /api/webhooks/register - SSRF (url → requests.get)
"""

import os
import json
import subprocess
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db import connection
from django.template import Template, Context
import requests


# -----------------------------------------------------------------------------
# TAINT FLOW #1: SQL Injection via raw SQL
# Source: request.GET['q'] (Angular UserService.searchUsers)
# Sink: cursor.execute()
# -----------------------------------------------------------------------------
@csrf_exempt
@require_http_methods(["GET"])
def search_users(request):
    """
    Vulnerable search endpoint with SQL injection.
    Angular frontend: UserService.searchUsers() → HTTP GET
    """
    query = request.GET.get('q', '')
    sort_by = request.GET.get('sort', 'username')
    limit = request.GET.get('limit', '100')

    # TAINT: User input directly interpolated into SQL
    # Attacker payload: q=' OR '1'='1' --
    sql = f"SELECT id, username, email, bio FROM users WHERE username LIKE '%{query}%' OR email LIKE '%{query}%' ORDER BY {sort_by} LIMIT {limit}"

    try:
        with connection.cursor() as cursor:
            cursor.execute(sql)  # SINK: SQL injection
            columns = [col[0] for col in cursor.description]
            users = [dict(zip(columns, row)) for row in cursor.fetchall()]

        return JsonResponse({
            'success': True,
            'users': users,
            'total': len(users),
            'query': sql  # Leaking the SQL query
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e),
            'query': sql  # Leaking query even on error
        }, status=500)


# -----------------------------------------------------------------------------
# TAINT FLOW #2: IDOR (Insecure Direct Object Reference)
# Source: user_id path parameter
# Sink: User.objects.get() without ownership check
# -----------------------------------------------------------------------------
@csrf_exempt
@require_http_methods(["GET", "PUT"])
def user_detail(request, user_id):
    """
    Vulnerable user detail endpoint without authorization.
    Angular frontend: UserService.getUserById() / updateProfile()
    """
    from django.contrib.auth.models import User

    try:
        # TAINT: No authorization check - any user can access any profile
        user = User.objects.get(id=user_id)

        if request.method == 'GET':
            return JsonResponse({
                'success': True,
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'bio': getattr(user, 'bio', ''),  # Stored XSS payload
                'role': 'admin' if user.is_superuser else 'user'
            })

        elif request.method == 'PUT':
            data = json.loads(request.body)

            # Mass assignment vulnerability - allows changing any field
            for key, value in data.items():
                if hasattr(user, key):
                    setattr(user, key, value)  # TAINT: Stored XSS via bio field

            user.save()

            return JsonResponse({
                'success': True,
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'bio': getattr(user, 'bio', '')
            })

    except User.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# -----------------------------------------------------------------------------
# TAINT FLOW #3: Path Traversal via file upload
# Source: request body 'path' field
# Sink: open(path, 'wb')
# -----------------------------------------------------------------------------
@csrf_exempt
@require_http_methods(["POST"])
def upload_avatar(request, user_id):
    """
    Vulnerable file upload with path traversal.
    Angular frontend: UserService.uploadAvatar()
    """
    try:
        data = json.loads(request.body)
        file_path = data.get('path', '')
        content = data.get('content', '')

        # TAINT: User controlled file path without sanitization
        # Attacker payload: "../../../etc/cron.d/malicious"

        # No validation that path is within allowed directory
        with open(file_path, 'w') as f:
            f.write(content)

        return JsonResponse({
            'success': True,
            'message': f'File saved to {file_path}',
            'path': file_path,
            'size': len(content)
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e),
            'attempted_path': data.get('path', '')
        }, status=500)


# -----------------------------------------------------------------------------
# TAINT FLOW #4: Command Injection via admin exec
# Source: request body 'command' field
# Sink: os.system() / subprocess.run(shell=True)
# -----------------------------------------------------------------------------
@csrf_exempt
@require_http_methods(["POST"])
def admin_exec(request):
    """
    Vulnerable command execution endpoint.
    Angular frontend: UserService.executeAdminCommand()
    """
    try:
        data = json.loads(request.body)
        command = data.get('command', '')

        # TAINT: User controlled command executed in shell
        # Attacker payload: "ls; cat /etc/passwd; rm -rf /"

        # Using subprocess with shell=True - vulnerable to command injection
        result = subprocess.run(
            command,
            shell=True,  # SINK: Command injection
            capture_output=True,
            text=True,
            timeout=30
        )

        return JsonResponse({
            'success': True,
            'output': result.stdout,
            'error': result.stderr,
            'returncode': result.returncode,
            'command': command  # Leaking the executed command
        })
    except subprocess.TimeoutExpired:
        return JsonResponse({
            'success': False,
            'error': 'Command timed out',
            'command': command
        }, status=408)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e),
            'command': data.get('command', '')
        }, status=500)


# -----------------------------------------------------------------------------
# TAINT FLOW #5: SSTI (Server-Side Template Injection)
# Source: request body 'template' field
# Sink: Template(template_string).render()
# -----------------------------------------------------------------------------
@csrf_exempt
@require_http_methods(["POST"])
def render_notification(request, user_id):
    """
    Vulnerable template rendering with SSTI.
    Angular frontend: UserService.renderNotification()
    """
    from django.contrib.auth.models import User

    try:
        data = json.loads(request.body)
        template_string = data.get('template', '')

        # Get user data for context
        try:
            user = User.objects.get(id=user_id)
            user_context = {
                'username': user.username,
                'email': user.email,
                'id': user.id
            }
        except User.DoesNotExist:
            user_context = {'username': 'Unknown', 'email': '', 'id': user_id}

        # TAINT: User controlled template string rendered by Django
        # Attacker payload: {{ settings.SECRET_KEY }} or {% load admin_list %}
        template = Template(template_string)
        context = Context({
            'user': user_context,
            'settings': {
                'site_name': 'Project Anarchy',
                'support_email': 'support@example.com'
            }
        })

        rendered = template.render(context)

        return JsonResponse({
            'success': True,
            'rendered': rendered,
            'template': template_string
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e),
            'template': data.get('template', '')
        }, status=500)


# -----------------------------------------------------------------------------
# TAINT FLOW #6: SSRF (Server-Side Request Forgery)
# Source: request body 'url' field
# Sink: requests.get(url)
# -----------------------------------------------------------------------------
@csrf_exempt
@require_http_methods(["POST"])
def register_webhook(request):
    """
    Vulnerable webhook registration with SSRF.
    Angular frontend: UserService.registerWebhook()
    """
    try:
        data = json.loads(request.body)
        url = data.get('url', '')
        events = data.get('events', [])

        # TAINT: User controlled URL used for server-side request
        # Attacker payload: http://169.254.169.254/latest/meta-data/
        # Or: http://localhost:6379/CONFIG%20SET%20dir%20/tmp

        # Validate webhook by making a request to it
        response = requests.get(
            url,
            timeout=5,
            # No URL validation, allows internal network access
        )

        webhook_id = f"webhook_{hash(url) % 100000}"

        return JsonResponse({
            'success': True,
            'id': webhook_id,
            'url': url,
            'events': events,
            'validation_status': response.status_code,
            'validation_body': response.text[:500]  # Leaking response
        })
    except requests.exceptions.RequestException as e:
        return JsonResponse({
            'success': False,
            'error': str(e),
            'url': url
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


# -----------------------------------------------------------------------------
# TAINT FLOW #7: Mass Assignment via user creation
# Source: entire request body
# Sink: User.objects.create(**data)
# -----------------------------------------------------------------------------
@csrf_exempt
@require_http_methods(["POST"])
def create_user(request):
    """
    Vulnerable user creation with mass assignment.
    Angular frontend: UserService.createUser()
    """
    from django.contrib.auth.models import User

    try:
        data = json.loads(request.body)

        # TAINT: User can include is_superuser=True in payload
        # No field filtering - allows setting any model field
        user = User.objects.create(**data)

        return JsonResponse({
            'success': True,
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_superuser': user.is_superuser  # Leaking privilege escalation
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


# -----------------------------------------------------------------------------
# TAINT FLOW #8: Arbitrary File Read
# Source: filename query parameter
# Sink: open(filename).read()
# -----------------------------------------------------------------------------
@csrf_exempt
@require_http_methods(["GET"])
def read_file(request):
    """
    Vulnerable file read endpoint.
    """
    filename = request.GET.get('file', '')

    # TAINT: User controlled filename
    # Attacker payload: ?file=../../../etc/passwd
    try:
        with open(filename, 'r') as f:
            content = f.read()

        return JsonResponse({
            'success': True,
            'filename': filename,
            'content': content,
            'size': len(content)
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e),
            'filename': filename
        }, status=500)
