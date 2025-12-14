import { NextResponse } from 'next/server'

// MBC Plus 본사 위치 (상암동)
const LATITUDE = 37.5789
const LONGITUDE = 126.8926

interface WeatherResponse {
  weather: Array<{
    id: number
    main: string
    description: string
    icon: string
  }>
  main: {
    temp: number
    temp_min: number
    temp_max: number
    humidity: number
  }
  sys: {
    sunrise: number
    sunset: number
  }
  name: string
}

// 날씨 설명 한글화
function getWeatherDescription(id: number): string {
  if (id >= 200 && id < 300) return '뇌우'
  if (id >= 300 && id < 400) return '이슬비'
  if (id >= 500 && id < 600) return '비'
  if (id >= 600 && id < 700) return '눈'
  if (id >= 700 && id < 800) {
    if (id === 701) return '옅은 안개'
    if (id === 711) return '연기'
    if (id === 721) return '옅은 안개'
    if (id === 731) return '황사'
    if (id === 741) return '안개'
    if (id === 751) return '모래바람'
    if (id === 761) return '먼지'
    if (id === 762) return '화산재'
    if (id === 771) return '돌풍'
    if (id === 781) return '토네이도'
    return '안개'
  }
  if (id === 800) return '맑음'
  if (id === 801) return '구름 조금'
  if (id === 802) return '구름 약간'
  if (id === 803) return '구름 많음'
  if (id === 804) return '흐림'
  return '알 수 없음'
}

// 날씨 아이콘
function getWeatherEmoji(id: number, isNight: boolean): string {
  if (id >= 200 && id < 300) return '⛈️'
  if (id >= 300 && id < 400) return '🌧️'
  if (id >= 500 && id < 600) return '🌧️'
  if (id >= 600 && id < 700) return '❄️'
  if (id >= 700 && id < 800) return '🌫️'
  if (id === 800) return isNight ? '🌙' : '☀️'
  if (id === 801 || id === 802) return isNight ? '🌙' : '⛅'
  if (id === 803 || id === 804) return '☁️'
  return '🌡️'
}

export async function GET() {
  try {
    const apiKey = process.env.OPENWEATHERMAP_API_KEY

    if (!apiKey) {
      console.error('ERROR: OPENWEATHERMAP_API_KEY is not set')
      return NextResponse.json(
        { error: 'OpenWeatherMap API key is not configured' },
        { status: 500 }
      )
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${LATITUDE}&lon=${LONGITUDE}&appid=${apiKey}&units=metric&lang=kr`

    const response = await fetch(url, { next: { revalidate: 600 } }) // 10분 캐시

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`)
    }

    const data: WeatherResponse = await response.json()

    const now = Math.floor(Date.now() / 1000)
    const isNight = now < data.sys.sunrise || now > data.sys.sunset

    const result = {
      description: getWeatherDescription(data.weather[0].id),
      emoji: getWeatherEmoji(data.weather[0].id, isNight),
      temp: Math.round(data.main.temp),
      tempMin: Math.round(data.main.temp_min),
      tempMax: Math.round(data.main.temp_max),
      humidity: data.main.humidity,
      sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      location: data.name,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Weather API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    )
  }
}
