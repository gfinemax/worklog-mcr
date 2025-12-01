import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function seedBroadcasts() {
    console.log('Seeding broadcast schedules...')

    const today = new Date().toISOString().split('T')[0]

    const broadcasts = [
        {
            date: today,
            type: 'broadcast',
            time: '13:00',
            channel_name: 'SPORTS+',
            program_title: 'PBA 챔피언십',
            match_info: 'X100-1(LIVE U), FA 3A-O(NIMBRA)',
            studio_label: 'ST-C',
            video_source_info: 'RET : ST-C M(NIMBRA)',
            audio_source_info: 'LIVE U - CH1, 2 : PGM / CH3, 4 : IS',
            transmission_path: 'TX NCC -',
            contact_info: '전정호 010-8912-7418',
            memo: '2/24 빛마루 신호체크 완료. 당일(토) 신호체크 한번 더 하기로 함.',
            status: 'scheduled'
        },
        {
            date: today,
            type: 'broadcast',
            time: '16:00',
            channel_name: 'SPORTS+',
            program_title: '호주프로야구 <질롱코리아 : 캔버라>',
            match_info: 'KT FS - 3, 4 / LG U+ FS - 1',
            studio_label: 'ST-B',
            video_source_info: 'IP RET - 2 (FA-1A-O)',
            audio_source_info: 'PGM',
            transmission_path: 'TX NCC - 7',
            contact_info: '원종우 +61 403 540 170',
            memo: 'TITAN LIVE < 유튜브, 카카오 LIVE ON >',
            status: 'scheduled'
        },
        {
            date: today,
            type: 'reception',
            time: '18:30',
            channel_name: 'MU EV',
            program_title: '쇼 챔피언',
            match_info: null,
            studio_label: 'ST-A',
            video_source_info: 'RE - 3,4',
            audio_source_info: null,
            transmission_path: 'TVRO - 1, 2',
            biss_key: 'ABCD1957ABC1',
            contact_info: null,
            memo: null,
            status: 'scheduled'
        },
        {
            date: today,
            type: 'reception',
            time: '19:00',
            channel_name: 'SPORTS1',
            program_title: 'AFC챔피언스리그 <FC서울:전북>',
            match_info: null,
            studio_label: 'ST-C',
            video_source_info: 'NCC FS - 1, 2',
            audio_source_info: null,
            transmission_path: 'TVRO - 3, 4 / TX NCC - 1, 2',
            biss_key: '555EF123DEC3',
            contact_info: null,
            memo: null,
            status: 'scheduled'
        }
    ]

    const { error } = await supabase.from('broadcast_schedules').insert(broadcasts)

    if (error) {
        console.error('Error seeding broadcasts:', error)
    } else {
        console.log('Successfully seeded broadcast schedules')
    }
}

seedBroadcasts()
