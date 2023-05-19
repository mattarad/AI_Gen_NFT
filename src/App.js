import { useState, useEffect } from "react"
import { NFTStorage, File } from "nft.storage"
import { Buffer } from "buffer"
import { ethers } from "ethers"
import axios from "axios"

import Spinner from "react-bootstrap/Spinner"
import Navigation from "./components/navigation"

import NFT from './abis/NFT.json'
import config from './config.json'


function App() {
  const [provider, setProvider] = useState(null)
  const [account, setAccount] = useState(null)
  const [nft, setNFT] = useState(null)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [image, setImage] = useState(null)
  const [url, setURL] = useState(null)

  const [message, setMessage] = useState("")
  const [isWaiting, setIsWaiting] = useState(false)

  const loadBlockchainData = async () => {
    let provider
    if(window.ethereum !== null) provider = new ethers.providers.Web3Provider(window.ethereum)
    else provider = new ethers.providers.Web3Provider("http://127.0.0.1:8545/")
    setProvider(provider)

    const network = await provider.getNetwork()

    const nft = new ethers.Contract(config[network.chainId].nft.address, NFT.abi, provider)
    setNFT(nft)
  }

  const submitHandler = async (e) => {
    e.preventDefault()
    
    if (name === "" || description === "") {
      window.alert("Please provide a name and description")
      return
    }
    setIsWaiting(true)

    const imageData = await createImage()

    const url = await uploadImage(imageData)

    await mintImage(url)

    setIsWaiting(false)
    setMessage("")
  }

  const createImage = async () => {
    setMessage("Generating Image...")

    const URL = `https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2`

    const response = await axios({
      url: URL,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.REACT_APP_HUGGING_FACE_API_KEY}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({
        inputs: description, options: { wait_for_model: true },
      }),
      responseType: 'arraybuffer',
    })

    const type = response.headers['content-type']
    const data = response.data

    const base64data = Buffer.from(data).toString('base64')
    const img = `data:${type};base64,` + base64data
    setImage(img)

    return data
  }

  const uploadImage = async (imageData) => {
    setMessage("Uploading Image...")

    const nftstorage = new NFTStorage({ token: process.env.REACT_APP_NFT_STORAGE_API_KEY })

    const { ipnft } = await nftstorage.store({
      image: new File([imageData], "image.jpeg", { type: "image/jpeg" }),
      name,
      description
    })

    const url = `https://ipfs.io/ipfs/${ipnft}/metadata.json`
    setURL(url)

    return url
  }

  const mintImage = async (tokenURI) => {
    setMessage("Waiting for mint...")

    const signer = await provider.getSigner()
    console.log(signer.address)
    const tx = await nft.connect(signer).mint(tokenURI, { value: ethers.utils.parseUnits('1', 'ether') })
    await tx.wait()
  }

  useEffect(() => {
    loadBlockchainData()
  }, [])

  return (
    <div>
      <Navigation account={account} setAccount={setAccount} />

      <div className="form">
        <form onSubmit={submitHandler}>
          <input type="text" placeholder="create a name" onChange={(e) => { setName(e.target.value) }} />
          <input type="text" placeholder="create a description" onChange={(e) => { setDescription(e.target.value) }} />
          <input type="submit" value="Create and Mint" />
        </form>

        <div className="image">
          {!isWaiting && image ? (
            <img src={image} alt="Ai Generated Image" />
          ) : isWaiting ? (
            <div className="image_placeholder">
              <Spinner animation="border" />
              <p>{message}</p>
            </div>
          ) : (
            <></>
          )}
        </div>
      </div>
      {!isWaiting && url && (
        <p>
          View&nbsp;<a href={url} target="blank" rel="noreferrer">Metadata</a>
        </p>
      )}
    </div>
  );
}

export default App;
