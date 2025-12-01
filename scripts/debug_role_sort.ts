
const members = [
    { name: "남궁장", role: "감독, 부감독" },
    { name: "윤주현", role: "영상" },
    { name: "이종원", role: "부감독, 감독" }
]

console.log("Original Order:")
members.forEach((m, i) => console.log(`${i}: ${m.name} (${m.role})`))

// Simulate the sort in app/login/page.tsx
const sortedMembers = [...members].sort((a, b) => a.name.localeCompare(b.name))

console.log("\nSorted Order (localeCompare):")
sortedMembers.forEach((m, i) => console.log(`${i}: ${m.name} (${m.role})`))

// Expected Roles based on index
// 0: Director
// 1: Assistant
// 2: Video

console.log("\nAssigned Roles (Normal):")
console.log(`Director (Index 0): ${sortedMembers[0].name}`)
console.log(`Assistant (Index 1): ${sortedMembers[1].name}`)
console.log(`Video (Index 2): ${sortedMembers[2].name}`)

console.log("\nAssigned Roles (Swap):")
console.log(`Director (Index 1): ${sortedMembers[1].name}`)
console.log(`Assistant (Index 0): ${sortedMembers[0].name}`)
console.log(`Video (Index 2): ${sortedMembers[2].name}`)
