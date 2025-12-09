"use client"

/**
 * 네트워크 프리셋 설정
 * 수신/송신/리턴 장비 및 채널 정보
 */

// 망 종류
export const NETWORK_TYPES = ['IP', '광수신', '위성'] as const
export type NetworkType = typeof NETWORK_TYPES[number]

// IP망 수신 소스
export const IP_SOURCES = ['LiveU', 'NIMBRA', 'DR5000'] as const
export type IPSource = typeof IP_SOURCES[number]

// 수신 설정 구조
export interface ReceptionConfig {
    type: NetworkType
    source?: string
    equipment: string
}

// 네트워크 프리셋 데이터
export const NETWORK_CONFIG = {
    reception: {
        'IP': {
            'LiveU': [
                { id: 'FA3AO', label: 'FA3AO (1-1)', port: '1-1' },
                { id: 'FA3BO', label: 'FA3BO (1-2)', port: '1-2' },
                { id: 'X100-1', label: 'X100-1 (2-1)', port: '2-1' },
                { id: 'X100-2', label: 'X100-2 (2-2)', port: '2-2' },
            ],
            'NIMBRA': [
                { id: 'KT3', label: 'KT3 (1-4)', port: '1-4' },
                { id: 'KT4', label: 'KT4 (2-4)', port: '2-4' },
            ],
            'DR5000': [
                { id: 'KT-FS3', label: 'KT FS3 (Main)', port: 'Main' },
                { id: 'KT-FS4', label: 'KT FS4 (Backup)', port: 'Backup' },
            ],
        },
        '광수신': {
            'LG FS': Array.from({ length: 8 }, (_, i) => ({
                id: `LG-FS-${i + 1}`,
                label: `LG FS-${i + 1}`,
                port: String(i + 1),
            })),
            'NCC FS': Array.from({ length: 6 }, (_, i) => ({
                id: `NCC-FS-${i + 1}`,
                label: `NCC FS-${i + 1}`,
                port: String(i + 1),
            })),
        },
        '위성': {
            'TVRO': Array.from({ length: 8 }, (_, i) => ({
                id: `TVRO-${i + 1}`,
                label: `TVRO-${i + 1}`,
                port: String(i + 1),
            })),
        },
    },
    transmission: {
        'TX NCC': Array.from({ length: 7 }, (_, i) => ({
            id: `TX-NCC-${i + 1}`,
            label: `TX NCC-${i + 1}`,
            channel: String(i + 1),
        })),
    },
    return: {
        'LG RET': Array.from({ length: 4 }, (_, i) => ({
            id: `LG-RET-${i + 1}`,
            label: `LG RET-${i + 1}`,
            channel: String(i + 1),
        })),
        'IP RET': Array.from({ length: 2 }, (_, i) => ({
            id: `IP-RET-${i + 1}`,
            label: `IP RET-${i + 1}`,
            channel: String(i + 1),
        })),
    },
} as const

// 스튜디오 목록
export const STUDIOS = ['ST-A', 'ST-B', 'ST-C', 'ST-D', 'ST-E'] as const

// 채널 목록
export const CHANNELS = ['SPORTS+', 'Every1', 'DRAMA', 'M', 'ON'] as const

// 유틸리티 함수: 망종류에 따른 소스 목록 가져오기
export function getSourcesByNetworkType(type: NetworkType): string[] {
    const sources = NETWORK_CONFIG.reception[type]
    return sources ? Object.keys(sources) : []
}

// 유틸리티 함수: 소스에 따른 장비 목록 가져오기
export function getEquipmentsBySource(type: NetworkType, source: string) {
    const sources = NETWORK_CONFIG.reception[type]
    if (!sources) return []
    return (sources as Record<string, Array<{ id: string; label: string; port: string }>>)[source] || []
}

// 송신 장비 목록
export function getTransmissionOptions() {
    return NETWORK_CONFIG.transmission['TX NCC']
}

// 리턴 타입 목록
export function getReturnTypes(): string[] {
    return Object.keys(NETWORK_CONFIG.return)
}

// 리턴 채널 목록
export function getReturnChannels(returnType: string) {
    return (NETWORK_CONFIG.return as Record<string, Array<{ id: string; label: string; channel: string }>>)[returnType] || []
}
