import { redirect } from "next/navigation"
export default async function home(){

    redirect("/login")

    return(
        <div>
        </div>
    )
}