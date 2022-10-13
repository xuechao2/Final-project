
async function deployContract(contractName, contractAddress) {
    
    console.log(`deploy contract ${contractName}...`)

    // Note that the script needs the ABI which is generated from the compilation artifact.
    // Make sure contract is compiled and artifacts are generated
    const artifactsPath = `browser/contracts/artifacts/${contractName}.json`
    const metadata = JSON.parse(await remix.call('fileManager', 'getFile', artifactsPath))

    let contract = new web3.eth.Contract(metadata.abi, contractAddress)

    return contract;
}

(async () => {
    try {
        console.log('Running setup...')
        const testInfoPath = `browser/tests/test_info.json`
        const testInfo = JSON.parse(await remix.call('fileManager', 'getFile', testInfoPath))
        const accounts = await web3.eth.getAccounts()
        const contracts_to_deploy = ['Mint', 'EUSD', 'sTSLA']
        var contracts = {}
        // Deploy three contracts from given addresses
        for (name of contracts_to_deploy) {
            contracts[name] = await deployContract(testInfo[name]['contractName'], testInfo[name]['contractAddress'])
        }

        
        // Grant minter / burner role to Mint contracts
        let minterRole = await contracts['sTSLA'].methods.MINTER_ROLE().call()
        let burnerRole = await contracts['sTSLA'].methods.BURNER_ROLE().call()

        let minter_result = await contracts['sTSLA'].methods.hasRole(minterRole, testInfo['Mint']['contractAddress']).call()
        let burner_result = await contracts['sTSLA'].methods.hasRole(burnerRole, testInfo['Mint']['contractAddress']).call()

        if (minter_result && burner_result) {
            console.log('all roles granted')
        }
        else {
            console.log('not granted')
            contracts['sTSLA'].methods.grantRole(minterRole, testInfo['Mint']['contractAddress']).send({
                from: accounts[0]
            }).on('receipt', function(receipt){
                console.log('minter role granted', receipt['transactionHash'])
            });
            contracts['sTSLA'].methods.grantRole(burnerRole, testInfo['Mint']['contractAddress']).send({
                from: accounts[0]
            }).on('receipt', function(receipt){
                console.log('burner role granted', receipt['transactionHash'])
            });
        }
        let registered = await contracts['Mint'].methods.checkRegistered(testInfo['sTSLA']['contractAddress']).call()
        if (!registered) {
            contracts['Mint'].methods.registerAsset(testInfo['sTSLA']['contractAddress'], 2, testInfo['sTSLA']['priceFeed']).send({
                from: accounts[0]
            }).on('receipt', function(receipt){
                console.log('sTSLA registered', receipt['transactionHash'])
            });
        } 
        else {
            console.log('sTSLA registered')
        }

    } catch (e) {
        console.log('err:', e)
    }
    
})()
