import { ethers } from "ethers";
import { Nav } from "react-bootstrap";

const Navigation = ({ account, setAccount }) => {
    const connectHandler = async () => {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        const account = ethers.utils.getAddress(accounts[0])
        setAccount(account)
    }

    return (
        <nav>
            <div className="nav_brand">
                <h1>AI NFT Generator</h1>
            </div>

            {account ? (
                <button type="button" className="nav_connect">
                    {account.slice(0,4) + '...' + account.slice(38,42)}
                </button>
            ) : (
                <button type="button" className="nav_connect" onClick={connectHandler}>
                    connect
                </button>
            )}
        </nav>
    )
}

export default Navigation