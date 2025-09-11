'use client'

import React, { useEffect, useState } from 'react'

import { UserResponseDto } from '@/types/user'
import { Edit, Trash2, User, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { format } from 'date-fns'
import RoleLabel from '@/components/admin/RoleLabel'
import BoxLicense from '@/components/admin/BoxLicense'
import { deleteUserApi, updateUserApi } from '@/lib/api/user-api'
import { Role } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/lib/constants/routes'

/** 기본 정보 */
const UserProfile = ({
  user,
  currentUser,
}: {
  user: UserResponseDto
  currentUser: UserResponseDto
}) => {
  const router = useRouter()
  const [freshUser, setFreshUser] = useState<UserResponseDto>(user)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [editName, setEditName] = useState<string>(freshUser.name)
  const [editRole, setEditRole] = useState<Role>(freshUser.role)
  const [isSaving, setIsSaving] = useState<boolean>(false)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between flex-wrap gap-2.5">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <User className="w-5 h-5 mr-2 text-gray-600" />
            기본 정보
          </h2>
          {currentUser && currentUser.role === 'ADMIN' && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                disabled={isEditing}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <Edit className="w-4 h-4 mr-1" />
                수정
              </Button>
              {currentUser.id !== freshUser.id && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const confirmed = confirm(
                      `사용자를 삭제하시겠습니까?\n삭제 후에도 1년 이내 동일 사번으로 재등록하면 기존 데이터가 복구됩니다.`,
                    )
                    if (!confirmed) return
                    
                    const res = await deleteUserApi(freshUser.id)
                    alert(res.message)
                    router.replace(ROUTES.ADMIN.USERS)
                  }}
                  disabled={isEditing}
                  className="border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  삭제
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 공정면허증 */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-3">공정면허증</label>
            <BoxLicense
              targetUser={freshUser}
              setFreshUser={setFreshUser}
              canEdit={currentUser?.role === 'ADMIN'}
            />
          </div>

          {/* 기본 정보 */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">사번</label>
              <div className="text-lg font-mono text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">
                {freshUser.userId}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
              {isEditing ? (
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="md:text-lg h-12 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="이름을 입력하세요"
                />
              ) : (
                <div className="text-lg text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">
                  {freshUser.name}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                역할
                {isEditing && currentUser.id === freshUser.id && (
                  <span className="ml-1 text-gray-400 text-sm">
                    (본인의 역할은 직접 수정할 수 없습니다.)
                  </span>
                )}
              </label>

              {currentUser.id !== freshUser.id && isEditing ? (
                <Select
                  value={editRole}
                  onValueChange={(value: 'ADMIN' | 'WORKER') => setEditRole(value)}
                >
                  <SelectTrigger className="py-5 text-lg bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WORKER">
                      <div className="flex items-center text-lg">작업자</div>
                    </SelectItem>
                    <SelectItem value="MANAGER">
                      <div className="flex items-center text-lg">작업반장</div>
                    </SelectItem>
                    <SelectItem value="ADMIN">
                      <div className="flex items-center text-lg">관리자</div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center">
                  <RoleLabel role={freshUser.role} size="lg" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">생년월일</label>
              <div className="text-lg font-mono text-gray-900 bg-gray-50 px-4 py-2 rounded-lg">
                {freshUser.birthday}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">등록일시</label>
              <div className="flex items-center text-gray-900 text-lg bg-gray-50 px-4 py-2 rounded-lg">
                <Calendar className="w-4 h-4 mr-2 text-gray-500 min-w-4" />
                {freshUser.createdAt && format(freshUser.createdAt, 'yyyy년 MM월 dd일 HH:mm:ss')}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* 편집 모드일 때 저장/취소 버튼 */}
      {isEditing && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                if (freshUser) {
                  setEditName(freshUser.name)
                  setEditRole(freshUser.role)
                }
                setIsEditing(false)
              }}
              disabled={isSaving}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              취소
            </Button>
            <Button
              onClick={async () => {
                setIsSaving(true)
                try {
                  const { data } = await updateUserApi(user.id, {
                    name: editName !== user.name ? editName : undefined,
                    role: editRole !== user.role ? editRole : undefined,
                  })
                  setFreshUser(data)
                  router.refresh()
                } catch (error: any) {
                  alert(`${error ? error : '수정 실패했습니다.'}`)
                } finally {
                  setEditName(freshUser.name)
                  setEditRole(freshUser.role)
                  setIsSaving(false)
                  setIsEditing(false)
                }
              }}
              disabled={isSaving}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <Edit className="w-4 h-4 mr-2" />
              {isSaving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserProfile
