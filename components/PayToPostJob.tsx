"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  Wallet,
  Loader2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Zap,
  Download,
  Smartphone,
  Globe,
  ArrowRight,
  Coins,
  RefreshCw,
  AlertTriangle,
} from "lucide-react"

declare global {
  interface Window {
    ethereum?: any
  }
}

interface PayToPostJobProps {
  onPaymentSuccess: () => void
}

export default function PayToPostJob({ onPaymentSuccess }: PayToPostJobProps) {
  const [status, setStatus] = useState<"idle" | "connecting" | "paying" | "confirming" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [txHash, setTxHash] = useState("")
  const [walletAddress, setWalletAddress] = useState("")
  const [networkInfo, setNetworkInfo] = useState<{ name: string; chainId: string } | null>(null)
  const [hasMetaMask, setHasMetaMask] = useState(false)
  const [balance, setBalance] = useState<string>("0")
  const [isCheckingBalance, setIsCheckingBalance] = useState(false)
  const { toast } = useToast()

  // Admin wallet address - properly checksummed
  const ADMIN_WALLET = "0x742d35cc6634c0532925a3b8d4c9db96c4b5da5a"
  const PAYMENT_AMOUNT = "0.001" // ETH

  useEffect(() => {
    checkMetaMaskInstallation()
  }, [])

  useEffect(() => {
    if (walletAddress && hasMetaMask) {
      checkBalance()
    }
  }, [walletAddress, hasMetaMask, networkInfo])

  const checkMetaMaskInstallation = async () => {
    if (typeof window !== "undefined") {
      const isInstalled = typeof window.ethereum !== "undefined" && window.ethereum.isMetaMask
      setHasMetaMask(isInstalled)

      if (isInstalled) {
        await checkWalletConnection()
      }
    }
  }

  const checkWalletConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" })
        if (accounts.length > 0) {
          setWalletAddress(accounts[0])
          await getNetworkInfo()
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error)
      }
    }
  }

  const getNetworkInfo = async () => {
    try {
      const chainId = await window.ethereum.request({ method: "eth_chainId" })
      const networkNames: { [key: string]: string } = {
        "0x1": "Ethereum Mainnet",
        "0x5": "Goerli Testnet",
        "0xaa36a7": "Sepolia Testnet",
        "0x89": "Polygon Mainnet",
        "0x13881": "Mumbai Testnet",
      }
      setNetworkInfo({
        chainId,
        name: networkNames[chainId] || "Unknown Network",
      })
    } catch (error) {
      console.error("Error getting network info:", error)
    }
  }

  const checkBalance = async () => {
    if (!window.ethereum || !walletAddress) return

    setIsCheckingBalance(true)
    try {
      const { ethers } = await import("ethers")
      const provider = new ethers.BrowserProvider(window.ethereum)
      const balanceWei = await provider.getBalance(walletAddress)
      const balanceEth = ethers.formatEther(balanceWei)
      setBalance(balanceEth)
    } catch (error) {
      console.error("Error checking balance:", error)
    } finally {
      setIsCheckingBalance(false)
    }
  }

  const connectWallet = async () => {
    if (!window.ethereum) {
      setErrorMessage("MetaMask is not installed. Please install MetaMask to continue.")
      setStatus("error")
      return
    }

    setStatus("connecting")
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
      setWalletAddress(accounts[0])
      await getNetworkInfo()
      setStatus("idle")
      toast({
        title: "🦊 Wallet Connected",
        description: `Connected to ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`,
      })
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to connect wallet")
      setStatus("error")
    }
  }

  const handlePayment = async () => {
    if (!window.ethereum) {
      setErrorMessage("MetaMask is not installed")
      setStatus("error")
      return
    }

    // Check if user has sufficient balance
    const balanceNum = Number.parseFloat(balance)
    const requiredAmount = Number.parseFloat(PAYMENT_AMOUNT)

    if (balanceNum < requiredAmount) {
      setErrorMessage(`Insufficient funds. You need at least ${PAYMENT_AMOUNT} ETH plus gas fees.`)
      setStatus("error")
      toast({
        title: "💰 Insufficient Funds",
        description: "Please get test ETH from faucets first!",
        variant: "destructive",
      })
      return
    }

    setStatus("paying")
    setErrorMessage("")

    try {
      // Import ethers dynamically to avoid SSR issues
      const { ethers } = await import("ethers")

      // Validate and checksum the admin address
      const validAdminWallet = ethers.getAddress(ADMIN_WALLET.toLowerCase())

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()

      // Create transaction
      const tx = await signer.sendTransaction({
        to: validAdminWallet,
        value: ethers.parseEther(PAYMENT_AMOUNT),
      })

      setTxHash(tx.hash)
      setStatus("confirming")

      toast({
        title: "🚀 Transaction Sent",
        description: "Waiting for blockchain confirmation...",
      })

      // Wait for confirmation
      const receipt = await tx.wait()

      if (receipt && receipt.status === 1) {
        // Transaction successful, record in database
        const token = localStorage.getItem("token")
        const response = await fetch("/api/payments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            txHash: tx.hash,
            amount: PAYMENT_AMOUNT,
            network: networkInfo?.name.toLowerCase().includes("goerli")
              ? "goerli"
              : networkInfo?.name.toLowerCase().includes("sepolia")
                ? "sepolia"
                : networkInfo?.name.toLowerCase().includes("mumbai")
                  ? "mumbai"
                  : "ethereum",
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            gasPrice: receipt.gasPrice?.toString() || "0",
            fromAddress: walletAddress,
            toAddress: ADMIN_WALLET,
            purpose: "job_posting",
          }),
        })

        if (response.ok) {
          setStatus("success")
          toast({
            title: "✅ Payment Successful!",
            description: "You can now post your job. Transaction recorded on blockchain.",
          })
          setTimeout(() => {
            onPaymentSuccess()
          }, 2000)
        } else {
          throw new Error("Failed to record payment in database")
        }
      } else {
        throw new Error("Transaction failed")
      }
    } catch (error: any) {
      console.error("Payment error:", error)
      setErrorMessage(error.message || "Payment failed")
      setStatus("error")
      toast({
        title: "❌ Payment Failed",
        description: error.message || "Transaction was rejected or failed",
        variant: "destructive",
      })
    }
  }

  const getFaucetLinks = () => {
    const chainId = networkInfo?.chainId
    switch (chainId) {
      case "0x5": // Goerli
        return [
          { name: "Goerli Faucet", url: "https://goerlifaucet.com/" },
          { name: "Chainlink Faucet", url: "https://faucets.chain.link/goerli" },
          { name: "Alchemy Faucet", url: "https://goerlifaucet.com/" },
        ]
      case "0xaa36a7": // Sepolia
        return [
          { name: "Sepolia Faucet", url: "https://sepoliafaucet.com/" },
          { name: "Chainlink Faucet", url: "https://faucets.chain.link/sepolia" },
          { name: "Alchemy Faucet", url: "https://sepoliafaucet.com/" },
        ]
      case "0x13881": // Mumbai
        return [
          { name: "Mumbai Faucet", url: "https://faucet.polygon.technology/" },
          { name: "Chainlink Faucet", url: "https://faucets.chain.link/mumbai" },
        ]
      default:
        return [
          { name: "Chainlink Faucets", url: "https://faucets.chain.link/" },
          { name: "Ethereum Faucets", url: "https://ethereum.org/en/developers/docs/networks/#testnets" },
        ]
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case "connecting":
      case "paying":
      case "confirming":
        return <Loader2 className="w-5 h-5 animate-spin" />
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-400" />
      default:
        return <Wallet className="w-5 h-5" />
    }
  }

  const getStatusMessage = () => {
    switch (status) {
      case "connecting":
        return "Connecting to wallet..."
      case "paying":
        return "Initiating payment..."
      case "confirming":
        return "Confirming transaction on blockchain..."
      case "success":
        return "Payment successful! Redirecting..."
      case "error":
        return errorMessage
      default:
        return walletAddress ? "Ready to pay" : "Connect your wallet to continue"
    }
  }

  const hasInsufficientFunds = walletAddress && Number.parseFloat(balance) < Number.parseFloat(PAYMENT_AMOUNT)

  // Show MetaMask installation guide if not installed
  if (!hasMetaMask) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-slate-800/80 border-slate-700 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Download className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-white text-xl">MetaMask Required</CardTitle>
            <CardDescription className="text-gray-400">
              You need MetaMask wallet to make payments and post jobs on our blockchain-secured platform
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Installation Options */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold flex items-center">
                <Globe className="w-4 h-4 mr-2 text-blue-400" />
                Browser Extension (Recommended)
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() =>
                    window.open(
                      "https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn",
                      "_blank",
                    )
                  }
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                >
                  <img src="/placeholder.svg?height=20&width=20&text=Chrome" alt="Chrome" className="w-4 h-4 mr-2" />
                  Chrome
                </Button>
                <Button
                  onClick={() =>
                    window.open("https://addons.mozilla.org/en-US/firefox/addon/ether-metamask/", "_blank")
                  }
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                >
                  <img src="/placeholder.svg?height=20&width=20&text=Firefox" alt="Firefox" className="w-4 h-4 mr-2" />
                  Firefox
                </Button>
                <Button
                  onClick={() =>
                    window.open(
                      "https://microsoftedge.microsoft.com/addons/detail/metamask/ejbalbakoplchlghecdalmeeeajnimhm",
                      "_blank",
                    )
                  }
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                >
                  <img src="/placeholder.svg?height=20&width=20&text=Edge" alt="Edge" className="w-4 h-4 mr-2" />
                  Edge
                </Button>
                <Button
                  onClick={() => window.open("https://brave.com/wallet/", "_blank")}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                >
                  <img src="/placeholder.svg?height=20&width=20&text=Brave" alt="Brave" className="w-4 h-4 mr-2" />
                  Brave
                </Button>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-4">
              <h3 className="text-white font-semibold flex items-center mb-3">
                <Smartphone className="w-4 h-4 mr-2 text-green-400" />
                Mobile App
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => window.open("https://apps.apple.com/us/app/metamask/id1438144202", "_blank")}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                >
                  <img src="/placeholder.svg?height=20&width=20&text=iOS" alt="iOS" className="w-4 h-4 mr-2" />
                  iOS App
                </Button>
                <Button
                  onClick={() => window.open("https://play.google.com/store/apps/details?id=io.metamask", "_blank")}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                >
                  <img src="/placeholder.svg?height=20&width=20&text=Android" alt="Android" className="w-4 h-4 mr-2" />
                  Android
                </Button>
              </div>
            </div>

            {/* Installation Steps */}
            <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
              <h4 className="text-white font-medium">Quick Setup:</h4>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-purple-600 text-white text-xs">1</Badge>
                  <span>Click your browser above to install MetaMask</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-purple-600 text-white text-xs">2</Badge>
                  <span>Create a new wallet or import existing</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-purple-600 text-white text-xs">3</Badge>
                  <span>Switch to Goerli or Sepolia testnet</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-purple-600 text-white text-xs">4</Badge>
                  <span>Get test ETH from faucets</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-purple-600 text-white text-xs">5</Badge>
                  <span>Refresh this page and connect wallet</span>
                </div>
              </div>
            </div>

            {/* Main Install Button */}
            <Button
              onClick={() => window.open("https://metamask.io/download/", "_blank")}
              className="w-full bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 text-white font-medium py-3"
            >
              <Download className="w-4 h-4 mr-2" />
              Install MetaMask Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            {/* Refresh Button */}
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
            >
              I've Installed MetaMask - Refresh Page
            </Button>

            {/* Help Links */}
            <div className="text-center space-y-2">
              <p className="text-xs text-gray-500">Need help?</p>
              <div className="flex justify-center space-x-4 text-xs">
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => window.open("https://metamask.zendesk.com/hc/en-us", "_blank")}
                  className="text-purple-400 hover:text-purple-300 p-0 h-auto"
                >
                  MetaMask Help
                </Button>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => window.open("https://faucets.chain.link/", "_blank")}
                  className="text-purple-400 hover:text-purple-300 p-0 h-auto"
                >
                  Get Test ETH
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show insufficient funds screen
  if (hasInsufficientFunds) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg bg-slate-800/80 border-slate-700 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Coins className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-white text-xl">Get Test ETH</CardTitle>
            <CardDescription className="text-gray-400">
              You need test ETH to pay for transactions. Get free test ETH from faucets below.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Current Balance */}
            <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Your Balance:</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-red-300 border-red-700">
                    {Number.parseFloat(balance).toFixed(4)} ETH
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={checkBalance}
                    disabled={isCheckingBalance}
                    className="p-1 h-auto text-gray-400 hover:text-white"
                  >
                    <RefreshCw className={`w-3 h-3 ${isCheckingBalance ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Required:</span>
                <Badge className="bg-green-900/50 text-green-300 border-green-700">{PAYMENT_AMOUNT} ETH + gas</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Network:</span>
                <Badge variant="outline" className="text-blue-300 border-blue-700">
                  {networkInfo?.name}
                </Badge>
              </div>
            </div>

            {/* Warning */}
            <div className="flex items-start space-x-3 p-3 bg-yellow-900/20 border border-yellow-700 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-yellow-300 font-medium">Insufficient Funds</p>
                <p className="text-yellow-200">
                  You need at least {PAYMENT_AMOUNT} ETH plus gas fees to complete the transaction.
                </p>
              </div>
            </div>

            {/* Faucet Links */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold flex items-center">
                <Coins className="w-4 h-4 mr-2 text-yellow-400" />
                Get Free Test ETH
              </h3>

              <div className="grid gap-3">
                {getFaucetLinks().map((faucet, index) => (
                  <Button
                    key={index}
                    onClick={() => window.open(faucet.url, "_blank")}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent justify-between"
                  >
                    <span>{faucet.name}</span>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
              <h4 className="text-white font-medium">How to get test ETH:</h4>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex items-center space-x-2">
                  <Badge className="bg-yellow-600 text-white text-xs">1</Badge>
                  <span>Click on a faucet link above</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-yellow-600 text-white text-xs">2</Badge>
                  <span>Paste your wallet address: {walletAddress?.substring(0, 10)}...</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-yellow-600 text-white text-xs">3</Badge>
                  <span>Complete any verification (captcha, etc.)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-yellow-600 text-white text-xs">4</Badge>
                  <span>Wait for the test ETH to arrive (1-5 minutes)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className="bg-yellow-600 text-white text-xs">5</Badge>
                  <span>Refresh your balance and try payment again</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={checkBalance}
                disabled={isCheckingBalance}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                {isCheckingBalance ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking Balance...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Balance
                  </>
                )}
              </Button>

              <Button
                onClick={() => window.open("https://faucets.chain.link/", "_blank")}
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
              >
                <Coins className="w-4 h-4 mr-2" />
                Open Chainlink Faucets
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {/* Copy Address Helper */}
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-2">Your wallet address:</p>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(walletAddress)
                  toast({
                    title: "📋 Address Copied",
                    description: "Wallet address copied to clipboard",
                  })
                }}
                variant="ghost"
                size="sm"
                className="text-purple-400 hover:text-purple-300 font-mono text-xs"
              >
                {walletAddress}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show payment interface if MetaMask is installed and has funds
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800/80 border-slate-700 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-white text-xl">Payment Required</CardTitle>
          <CardDescription className="text-gray-400">
            Pay {PAYMENT_AMOUNT} ETH to post your job on the platform
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Wallet Connection Status */}
          {walletAddress && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Wallet:</span>
                <Badge variant="secondary" className="bg-green-900/50 text-green-300 border-green-700">
                  {walletAddress.substring(0, 6)}...{walletAddress.substring(38)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Balance:</span>
                <Badge variant="outline" className="text-green-300 border-green-700">
                  {Number.parseFloat(balance).toFixed(4)} ETH
                </Badge>
              </div>
              {networkInfo && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Network:</span>
                  <Badge variant="outline" className="text-blue-300 border-blue-700">
                    {networkInfo.name}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {/* Payment Details */}
          <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Amount:</span>
              <span className="text-white font-semibold">{PAYMENT_AMOUNT} ETH</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Purpose:</span>
              <span className="text-white">Job Posting Fee</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">To:</span>
              <span className="text-white text-sm">
                {ADMIN_WALLET.toLowerCase().substring(0, 6)}...{ADMIN_WALLET.toLowerCase().substring(38)}
              </span>
            </div>
          </div>

          {/* Status Message */}
          <div className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded-lg">
            {getStatusIcon()}
            <span className={`text-sm ${status === "error" ? "text-red-400" : "text-gray-300"}`}>
              {getStatusMessage()}
            </span>
          </div>

          {/* Transaction Hash */}
          {txHash && (
            <div className="space-y-2">
              <span className="text-gray-400 text-sm">Transaction Hash:</span>
              <div className="flex items-center space-x-2">
                <code className="text-xs bg-slate-700 px-2 py-1 rounded text-green-400 flex-1 truncate">{txHash}</code>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent p-2"
                  onClick={() => window.open(`https://etherscan.io/tx/${txHash}`, "_blank")}
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {!walletAddress ? (
              <Button
                onClick={connectWallet}
                disabled={status === "connecting"}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                {status === "connecting" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect MetaMask
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handlePayment}
                disabled={status === "paying" || status === "confirming" || status === "success"}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {status === "paying" || status === "confirming" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {status === "paying" ? "Processing..." : "Confirming..."}
                  </>
                ) : status === "success" ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Payment Complete
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Pay {PAYMENT_AMOUNT} ETH
                  </>
                )}
              </Button>
            )}

            {status === "error" && (
              <Button
                onClick={() => {
                  setStatus("idle")
                  setErrorMessage("")
                }}
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
              >
                Try Again
              </Button>
            )}
          </div>

          {/* Help Text */}
          <div className="text-center text-xs text-gray-500">
            <p>Make sure you're on a testnet (Goerli/Sepolia) for testing</p>
            <p>Transaction fees will be deducted from your wallet</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
