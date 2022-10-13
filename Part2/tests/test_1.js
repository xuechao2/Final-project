
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
    try{
        console.log('Running test...')
        const testInfoPath = `browser/tests/test_info.json`
        const testInfo = JSON.parse(await remix.call('fileManager', 'getFile', testInfoPath))
        const accounts = await web3.eth.getAccounts()
        const contracts_to_deploy = ['Mint', 'EUSD', 'sTSLA']
        var contracts = {}
        // Deploy three contracts from given addresses
        for (name of contracts_to_deploy) {
            contracts[name] = await deployContract(testInfo[name]['contractName'], testInfo[name]['contractAddress'])
        }
        
        // Test openPosition
        console.log('Test 1: test openPosition...')
        const collateralAmount = 3000 * 10 ** 8
        const collateralRatio = 2

        contracts['EUSD'].methods.approve(testInfo['Mint']['contractAddress'], collateralAmount).send({from: accounts[0]}).then( (receipt) => {
            contracts['Mint'].methods.openPosition(collateralAmount, testInfo['sTSLA']['contractAddress'], collateralRatio).send({from: accounts[0]}).then( (receipt) => {
                contracts['Mint'].methods.getPosition(0).call((err, result) => { 
                    console.log(result)
                    if (parseInt(result[3] / (10 ** 8)) == 1) {
                        console.log('Test 1: PASS')
                    }
                    else {console.log('Test 1: Fail')}
                })
            })
        })

    } catch (e) {
        console.log('err:', e)
    }
})()
