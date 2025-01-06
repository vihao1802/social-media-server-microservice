
export type UserResponseDTO = {
    id: string
    email: string
    bio?: string | null
    username: string
    profileImg?: string | null
    gender?: string
    DateOfBirth: Date | string
    isLocked?: boolean
    isDisabled?: boolean
    isOnline?: boolean
    createdAt?: Date | string
    roleId: number
    role: {
        id: number,
        roleName: string
    }
}