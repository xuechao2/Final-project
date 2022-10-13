
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
        console.log('Test 2: test deposit...')
        const collateralAmount = 3000 * 10 ** 8
        const collateralRatio = 2

        contracts['EUSD'].methods.approve(testInfo['Mint']['contractAddress'], collateralAmount).send({from: accounts[0]}).then( (receipt) => {
            contracts['Mint'].methods.deposit(0, collateralAmount).send({from: accounts[0]}).then( (receipt) => {
                contracts['Mint'].methods.getPosition(0).call((err, result) => { 
                    if (result[1] == 2 * collateralAmount) {
                        console.log('Test 2: PASS')
                    }
                    else {console.log('Test 2: Fail')}

                    console.log('Test 3: test withdraw...')
                    contracts['Mint'].methods.withdraw(0, collateralAmount).send({from: accounts[0]}).then( (receipt) => {
                        contracts['Mint'].methods.getPosition(0).call((err, result) => { 
                            if (result[1] == collateralAmount) {
                                console.log('Test 3: PASS')
                            }
                            else {console.log('Test 3: Fail')}
                        })
                    })
                })
            })
        })
    } catch (e) {
        console.log('err:', e)
    }
})()
