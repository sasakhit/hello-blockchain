package main

import (
  "encoding/json"
	"errors"
	"fmt"

	"github.com/hyperledger/fabric/core/chaincode/shim"
)

type SlChaincode struct {
}

type Transaction struct {
  BRInd string `json:"brInd"`
  Borrower string `json:"borrower"`
  Lender string `json:"lender"`
  SecCode string `json:"secCode"`
  Qty float64 `json:"qty"`
  Ccy string `json:"ccy"`
  Amt float64 `json:"amt"`
}

type Outstanding struct {
  Borrower string `json:"borrower"`
  Lender string `json:"lender"`
  SecCode string `json:"secCode"`
  Qty float64 `json:"qty"`
}

func (cc *SlChaincode) Init(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
  fmt.Println("Initializing")

  return nil, nil
}

func (cc *SlChaincode) Invoke(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
  fmt.Println("Invoking")
  // Handle by function name
  if function == "tradeSl" {
    return cc.tradeSl(stub, args)
  } else if function == "calcMarginCall" {
    return cc.calcMarginCall(stub, args)
  }

  return nil, errors.New("Received unknown function")
}

func (cc *SlChaincode) Query(stub shim.ChaincodeStubInterface, function string, args []string) ([]byte, error) {
  fmt.Println("Querying")
  // Handle by function name
  if function == "getOutstandings" {
    return cc.getOutstandings(stub, args)
  }

  return nil, errors.New("Received unknown function")
}

func getOutstanding(stub shim.ChaincodeStubInterface, key string) (Outstanding, bool, error) {
  var outstanding Outstanding
  found := false

  outstandingBytes, err := stub.GetState(key)
  if err != nil {
    fmt.Println("Error retrieving outstanding " + key)
    return outstanding, found, errors.New("Error retrieving outstanding " + key)
  }

	if outstandingBytes != nil {
		fmt.Println("Outstanding found " + key)
		found = true

    fmt.Println("Unmarshalling Outstanding")
    err = json.Unmarshal(outstandingBytes, &outstanding)
    if err != nil {
      fmt.Println("Error unmarshalling outstanding " + key)
      return outstanding, found, errors.New("Error unmarshalling outstanding " + key)
    }
	}

  return outstanding, found, nil
}

func addNewKeys(stub shim.ChaincodeStubInterface, newKeys []string) (error) {
  keysBytes, err := stub.GetState("OutstandingKeys")
  if err != nil {
    fmt.Println("Error retrieving Outstanding keys")
    return errors.New("Error retrieving Outstanding keys")
  }

  var keys []string
  if keysBytes != nil {
    err = json.Unmarshal(keysBytes, &keys)
    if err != nil {
      fmt.Println("Error unmarshalling Outstanding keys")
      return errors.New("Error unmarshalling Outstanding keys")
    }
  }

  keys = append(keys, newKeys...)

  keysBytesToWrite, err := json.Marshal(&keys)
  if err != nil {
    fmt.Println("Error marshalling keys")
    return errors.New("Error marshalling the keys")
  }

  fmt.Println("Put state on OutstandingKeys")
  err = stub.PutState("OutstandingKeys", keysBytesToWrite)
  if err != nil {
    fmt.Println("Error writting keys")
    return errors.New("Error writing the keys")
  }

  return nil
}

func writeOutstanding(stub shim.ChaincodeStubInterface, key string, outstanding Outstanding) (error) {
  outstandingBytesToWrite, err := json.Marshal(&outstanding)
  if err != nil {
    fmt.Println("Error marshalling outstanding " + key)
    return errors.New("Error marshalling outstanding " + key)
  }

  fmt.Println("Put state on outstanding")
  err = stub.PutState(key, outstandingBytesToWrite)
  if err != nil {
    fmt.Println("Error writing outstanding " + key)
    return errors.New("Error writing outstanding " + key)
  }

  return nil
}

func (cc *SlChaincode) tradeSl(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
  fmt.Println("Trading Stockloan")

  if len(args) != 1 {
    return nil, errors.New("Incorrect number of arguments. Expecting Stockloan transaction record")
  }

  var tr Transaction

  fmt.Println("Unmarshalling Transaction")
	err := json.Unmarshal([]byte(args[0]), &tr)
	if err != nil {
		fmt.Println("Error Unmarshalling Transaction")
		return nil, errors.New("Invalid Stockloan transaction")
	}

  // Get outstanding stockloan
  var slKey = tr.Borrower + "-" + tr.Lender + "-" + tr.SecCode

	fmt.Println("Getting State on Borrower-Lender-SecCode " + slKey)
  outstandingSl, outstandingSlFound, err := getOutstanding(stub, slKey)
  if err != nil {
    fmt.Println("Error getting outstanding " + slKey)
    return nil, errors.New("Error getting outstanding " + slKey)
  }

  // Get outstanding collateral
  var collKey = tr.Lender + "-" + tr.Borrower + "-" + tr.Ccy

	fmt.Println("Getting State on Lender-Borrower-Ccy " + collKey)
  outstandingColl, outstandingCollFound, err := getOutstanding(stub, collKey)
  if err != nil {
    fmt.Println("Error getting outstanding " + collKey)
    return nil, errors.New("Error getting outstanding " + collKey)
  }

  var newKeys []string
  fmt.Println("Transfering outstanding")
  if tr.BRInd == "B" { // Borrow case
    if outstandingSlFound == true {
      outstandingSl.Qty += tr.Qty
    } else {
      outstandingSl = Outstanding{Borrower: tr.Borrower, Lender: tr.Lender, SecCode: tr.SecCode, Qty: tr.Qty}
      newKeys = append(newKeys, slKey)
    }

    if outstandingCollFound == true {
      outstandingColl.Qty += tr.Amt
    } else {
      outstandingColl = Outstanding{Borrower: tr.Lender, Lender: tr.Borrower, SecCode: tr.Ccy, Qty: tr.Amt}
      newKeys = append(newKeys, collKey)
    }
  } else { // Return case
    if outstandingSlFound == true && outstandingSl.Qty >= tr.Qty && outstandingCollFound == true && outstandingColl.Qty >= tr.Amt {
      outstandingSl.Qty -= tr.Qty
      outstandingColl.Qty -= tr.Amt
    } else {
      return nil, errors.New("Not enough outstandings to return")
    }
  }

  // Add new OutstandingKeys to World State
  if len(newKeys) > 0 {
    err := addNewKeys(stub, newKeys)
    if err != nil {
  		fmt.Println("Error adding new OutstandingKeys")
  		return nil, errors.New("Error adding new OutstandingKeys")
  	}
  }

  // Write to World State
  // Stockloan
  err = writeOutstanding(stub, slKey, outstandingSl)
  if err != nil {
		fmt.Println("Error writing outstanding " + slKey)
		return nil, errors.New("Error writing outstanding " + slKey)
	}

  // Collateral
  err = writeOutstanding(stub, collKey, outstandingColl)
  if err != nil {
		fmt.Println("Error writing outstanding " + collKey)
		return nil, errors.New("Error writing outstanding " + collKey)
	}

  fmt.Println("Successfully completed Invoke")
  return nil, nil
}

func (cc *SlChaincode) calcMarginCall(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
  fmt.Println("Calculating margin call")

  var outstandings []Outstanding
  outstandingsBytes, err := cc.getOutstandings(stub, args)
  if err != nil {
    fmt.Println("Error getting outstandings")
    return nil, errors.New("Error getting outstandings")
  }

  err = json.Unmarshal(outstandingsBytes, &outstandings)
  if err != nil {
    fmt.Println("Error unmarshalling outstandings")
    return nil, errors.New("Error unmarshalling outstandings")
  }

  //Todo: Margin calculation

  fmt.Println("Successfully completed Invoke")
  return nil, nil
}

func (cc *SlChaincode) getOutstandings(stub shim.ChaincodeStubInterface, args []string) ([]byte, error) {
  var allOutstandings []Outstanding

  // Get list of all the keys
	keysBytes, err := stub.GetState("OutstandingKeys")
	if err != nil {
		fmt.Println("Error retrieving Outstanding keys")
		return nil, errors.New("Error retrieving Outstanding keys")
	}

  // In case of no outstandings
  if keysBytes == nil {
    noOutstandings := []Outstanding{Outstanding{Borrower: "No outstandings", Lender: "", SecCode: "", Qty: 0}}

    noOutstandingsBytes, err := json.Marshal(&noOutstandings)
  	if err != nil {
  		fmt.Println("Error marshalling noOutstandings")
  		return nil, err
  	}

    return noOutstandingsBytes, nil
  }

	var keys []string
	err = json.Unmarshal(keysBytes, &keys)
	if err != nil {
		fmt.Println("Error unmarshalling Outstanding keys")
		return nil, errors.New("Error unmarshalling Outstanding keys")
	}

	// Get all the outstandings
	for _, value := range keys {
		outstandingBytes, err := stub.GetState(value)

		var outstanding Outstanding
		err = json.Unmarshal(outstandingBytes, &outstanding)
		if err != nil {
			fmt.Println("Error retrieving outstanding " + value)
			return nil, errors.New("Error retrieving outstanding " + value)
		}

		fmt.Println("Appending outstanding " + value)
		allOutstandings = append(allOutstandings, outstanding)
	}

  allOutstandingsBytes, err := json.Marshal(&allOutstandings)
	if err != nil {
		fmt.Println("Error marshalling allOutstandings")
		return nil, err
	}

  fmt.Println("All success, returning allOutstandings")
	return allOutstandingsBytes, nil
}

func main() {
  err := shim.Start(new(SlChaincode))
  if err != nil {
    fmt.Printf("Error starting chaincode: %s", err)
  }
}
