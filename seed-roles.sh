#!/bin/bash

# Seed Default Roles Script
# This script creates the default system roles with their permissions

echo "🔄 Seeding default roles..."

API_URL="http://localhost:5000/api"

# You'll need to get a Super Admin token first
# For now, we'll create roles directly via MongoDB or through a special endpoint

# Super Admin Role
curl -X POST "${API_URL}/roles/seed" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "superadmin",
    "displayName": "Super Admin",
    "description": "Full system access with all permissions",
    "isSystem": true,
    "permissions": {
      "viewUsers": true,
      "createUsers": true,
      "editUsers": true,
      "deleteUsers": true,
      "viewDepartments": true,
      "createDepartments": true,
      "editDepartments": true,
      "deleteDepartments": true,
      "viewAllTasks": true,
      "createTasks": true,
      "editOwnTasks": true,
      "editAllTasks": true,
      "deleteOwnTasks": true,
      "deleteAllTasks": true,
      "viewApprovals": true,
      "approveRejectTasks": true,
      "viewReports": true,
      "downloadReports": true,
      "viewRoles": true,
      "createRoles": true,
      "editRoles": true,
      "deleteRoles": true
    }
  }'

echo "✅ Default roles seeded successfully!"
