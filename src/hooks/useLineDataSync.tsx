import { useEffect, useRef, useState } from 'react'
import { supabaseClient } from '@/lib/supabase/client'
import { getLineWithProcess } from '@/lib/api/line-with-process-api'
import { LineResponseDto } from '@/types/line-with-process'

/**
 * 라인/공정 데이터 실시간 동기화 훅
 * Supabase Realtime을 통해 데이터베이스 변경사항을 감지하고 동기화
 */
const useLineDataSync = ({
  isLocked,
  isEditMode,
  onDataUpdate,
  setSaveProgress,
}: {
  isLocked: boolean
  isEditMode: boolean
  onDataUpdate: (data: LineResponseDto[]) => void
  setSaveProgress: (progress: number) => void
}) => {
  const isEditModeRef = useRef(isEditMode)
  const isLockedRef = useRef(isLocked)

  // 편집모드 상태를 ref로 관리 (클로저 문제 방지)
  useEffect(() => {
    isEditModeRef.current = isEditMode
  }, [isEditMode])

  useEffect(() => {
    isLockedRef.current = isLocked
  }, [isLocked])

  useEffect(() => {
    const channel = supabaseClient.channel('line-process-sync')
    let changeTimeout: NodeJS.Timeout | null = null

    const handleDataChange = (type: string) => {
      // 기존 타이머가 있으면 취소
      if (changeTimeout) {
        clearTimeout(changeTimeout)
      }

      // 500ms 후에 한 번만 로그 출력 (디바운싱)
      changeTimeout = setTimeout(async () => {
        console.log(`🔄 ${type} 데이터 변경 완료 - 일괄 처리됨`)

        // 편집모드가 아니고 락이 걸리지 않았을 때만 데이터 동기화 (성능 최적화)
        if (!isEditModeRef.current && !isLockedRef.current) {
          setSaveProgress(30)
          try {
            const { data } = await getLineWithProcess()
            setSaveProgress(70)
            onDataUpdate(data)
          } catch (e) {
            console.error('Failed to sync line data:', e)
          } finally {
            setSaveProgress(100)
            setTimeout(() => {
              setSaveProgress(0)
            }, 500)
          }
        }
      }, 500)
    }

    // 모든 라인/공정 관련 변경사항 감지
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lines' }, () => {
        handleDataChange('라인')
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'processes' }, () => {
        handleDataChange('공정')
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'process_shifts' }, () => {
        handleDataChange('교대조')
      })
      .subscribe()

    return () => {
      if (changeTimeout) {
        clearTimeout(changeTimeout)
      }
      supabaseClient.removeChannel(channel)
    }
  }, [])

  return {}
}

export default useLineDataSync
