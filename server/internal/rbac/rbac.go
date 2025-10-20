package rbac

import (
	"context"
	"fmt"
	"strings"

	"eesigorta/backend/internal/repo"

	"gorm.io/gorm"
)

type RBACManager struct {
	db *gorm.DB
}

func NewRBACManager(db *gorm.DB) *RBACManager {
	return &RBACManager{db: db}
}

// Permission constants
const (
	// User permissions
	PermissionUserCreate   = "user:create"
	PermissionUserRead     = "user:read"
	PermissionUserUpdate   = "user:update"
	PermissionUserDelete   = "user:delete"
	PermissionUserList     = "user:list"

	// Branch permissions
	PermissionBranchCreate = "branch:create"
	PermissionBranchRead   = "branch:read"
	PermissionBranchUpdate = "branch:update"
	PermissionBranchDelete = "branch:delete"
	PermissionBranchList   = "branch:list"

	// Agent permissions
	PermissionAgentCreate = "agent:create"
	PermissionAgentRead   = "agent:read"
	PermissionAgentUpdate = "agent:update"
	PermissionAgentDelete = "agent:delete"
	PermissionAgentList   = "agent:list"

	// Customer permissions
	PermissionCustomerCreate = "customer:create"
	PermissionCustomerRead   = "customer:read"
	PermissionCustomerUpdate = "customer:update"
	PermissionCustomerDelete = "customer:delete"
	PermissionCustomerList   = "customer:list"

	// Policy permissions
	PermissionPolicyCreate = "policy:create"
	PermissionPolicyRead   = "policy:read"
	PermissionPolicyUpdate = "policy:update"
	PermissionPolicyDelete = "policy:delete"
	PermissionPolicyList   = "policy:list"

	// Quote permissions
	PermissionQuoteCreate = "quote:create"
	PermissionQuoteRead   = "quote:read"
	PermissionQuoteUpdate = "quote:update"
	PermissionQuoteDelete = "quote:delete"
	PermissionQuoteList   = "quote:list"

	// Report permissions
	PermissionReportRead   = "report:read"
	PermissionReportExport = "report:export"

	// Scraper permissions
	PermissionScraperRun    = "scraper:run"
	PermissionScraperManage = "scraper:manage"
)

// Role constants
const (
	RoleAdmin         = "admin"
	RoleBranchManager = "branch_manager"
	RoleAgent         = "agent"
	RoleViewer        = "viewer"
)

func (r *RBACManager) InitializeRoles() error {
	// Define role-permission mappings
	rolePermissions := map[string][]string{
		RoleAdmin: {
			PermissionUserCreate, PermissionUserRead, PermissionUserUpdate, PermissionUserDelete, PermissionUserList,
			PermissionBranchCreate, PermissionBranchRead, PermissionBranchUpdate, PermissionBranchDelete, PermissionBranchList,
			PermissionAgentCreate, PermissionAgentRead, PermissionAgentUpdate, PermissionAgentDelete, PermissionAgentList,
			PermissionCustomerCreate, PermissionCustomerRead, PermissionCustomerUpdate, PermissionCustomerDelete, PermissionCustomerList,
			PermissionPolicyCreate, PermissionPolicyRead, PermissionPolicyUpdate, PermissionPolicyDelete, PermissionPolicyList,
			PermissionQuoteCreate, PermissionQuoteRead, PermissionQuoteUpdate, PermissionQuoteDelete, PermissionQuoteList,
			PermissionReportRead, PermissionReportExport,
			PermissionScraperRun, PermissionScraperManage,
		},
		RoleBranchManager: {
			PermissionAgentCreate, PermissionAgentRead, PermissionAgentUpdate, PermissionAgentDelete, PermissionAgentList,
			PermissionCustomerCreate, PermissionCustomerRead, PermissionCustomerUpdate, PermissionCustomerDelete, PermissionCustomerList,
			PermissionPolicyCreate, PermissionPolicyRead, PermissionPolicyUpdate, PermissionPolicyDelete, PermissionPolicyList,
			PermissionQuoteCreate, PermissionQuoteRead, PermissionQuoteUpdate, PermissionQuoteDelete, PermissionQuoteList,
			PermissionReportRead, PermissionReportExport,
		},
		RoleAgent: {
			PermissionCustomerCreate, PermissionCustomerRead, PermissionCustomerUpdate, PermissionCustomerList,
			PermissionPolicyCreate, PermissionPolicyRead, PermissionPolicyUpdate, PermissionPolicyList,
			PermissionQuoteCreate, PermissionQuoteRead, PermissionQuoteUpdate, PermissionQuoteList,
			PermissionReportRead,
		},
		RoleViewer: {
			PermissionCustomerRead, PermissionCustomerList,
			PermissionPolicyRead, PermissionPolicyList,
			PermissionQuoteRead, PermissionQuoteList,
			PermissionReportRead,
		},
	}

	// Create permissions
	for _, permissions := range rolePermissions {
		for _, permissionName := range permissions {
			parts := strings.Split(permissionName, ":")
			if len(parts) != 2 {
				continue
			}

			var permission repo.Permission
			err := r.db.Where("name = ?", permissionName).First(&permission).Error
			if err == gorm.ErrRecordNotFound {
				permission = repo.Permission{
					Name:        permissionName,
					Description: fmt.Sprintf("Permission to %s %s", parts[1], parts[0]),
					Resource:    parts[0],
					Action:      parts[1],
				}
				if err := r.db.Create(&permission).Error; err != nil {
					return fmt.Errorf("failed to create permission %s: %w", permissionName, err)
				}
			}
		}
	}

	// Create roles and assign permissions
	for roleName, permissions := range rolePermissions {
		var role repo.Role
		err := r.db.Where("name = ?", roleName).First(&role).Error
		if err == gorm.ErrRecordNotFound {
			role = repo.Role{
				Name:        roleName,
				Description: fmt.Sprintf("System role: %s", roleName),
				IsSystem:    true,
			}
			if err := r.db.Create(&role).Error; err != nil {
				return fmt.Errorf("failed to create role %s: %w", roleName, err)
			}
		}

		// Assign permissions to role
		for _, permissionName := range permissions {
			var permission repo.Permission
			if err := r.db.Where("name = ?", permissionName).First(&permission).Error; err != nil {
				continue
			}

			var rolePermission repo.RolePermission
			err := r.db.Where("role_id = ? AND permission_id = ?", role.ID, permission.ID).First(&rolePermission).Error
			if err == gorm.ErrRecordNotFound {
				rolePermission = repo.RolePermission{
					RoleID:       role.ID,
					PermissionID: permission.ID,
				}
				if err := r.db.Create(&rolePermission).Error; err != nil {
					return fmt.Errorf("failed to assign permission %s to role %s: %w", permissionName, roleName, err)
				}
			}
		}
	}

	return nil
}

func (r *RBACManager) HasPermission(userID uint, permission string) (bool, error) {
	var count int64
	err := r.db.Table("role_permissions rp").
		Joins("JOIN roles r ON r.id = rp.role_id").
		Joins("JOIN permissions p ON p.id = rp.permission_id").
		Joins("JOIN users u ON u.role = r.name").
		Where("u.id = ? AND p.name = ?", userID, permission).
		Count(&count).Error

	if err != nil {
		return false, fmt.Errorf("failed to check permission: %w", err)
	}

	return count > 0, nil
}

func (r *RBACManager) GetUserPermissions(userID uint) ([]string, error) {
	var permissions []string
	err := r.db.Table("role_permissions rp").
		Select("p.name").
		Joins("JOIN roles r ON r.id = rp.role_id").
		Joins("JOIN permissions p ON p.id = rp.permission_id").
		Joins("JOIN users u ON u.role = r.name").
		Where("u.id = ?", userID).
		Pluck("p.name", &permissions).Error

	if err != nil {
		return nil, fmt.Errorf("failed to get user permissions: %w", err)
	}

	return permissions, nil
}

func (r *RBACManager) RequirePermission(permission string) func(ctx context.Context) error {
	return func(ctx context.Context) error {
		userID, ok := ctx.Value("user_id").(uint)
		if !ok {
			return fmt.Errorf("user_id not found in context")
		}

		hasPermission, err := r.HasPermission(userID, permission)
		if err != nil {
			return err
		}

		if !hasPermission {
			return fmt.Errorf("insufficient permissions: %s", permission)
		}

		return nil
	}
}
