import { LightningElement, api, wire } from 'lwc';
import fetchCustType from '@salesforce/apex/FdDetailsFields.fetchCustomerType'
import { getPicklistValues, getObjectInfo } from 'lightning/uiObjectInfoApi';
import FD_Details_Local from '@salesforce/schema/FD_Details__c'
import Dep_Type_Local from '@salesforce/schema/FD_Details__c.Deposit_Type__c'
import Pay_Freq_Local from '@salesforce/schema/FD_Details__c.Payout_Frequency__c'
import fetchSchemeMethod from '@salesforce/apex/FdDetailsFields.fetchSchemes'
import updateFDRecord from '@salesforce/apex/FdDetailsFields.updateFD'
import { ShowToastEvent } from 'lightning/platformShowToastEvent'
export default class SelectingScheme extends LightningElement {

    customerOptions
    @api recordId
    selectedCusType=''
    depTypeOptions
    selectedDepType=''
    payoutFreqData
    payFreqOptions
    selectedPayFreq=''
    selectedTenorMonth=''
    selectedTenorDay=''
    givenfDAmount=0
    intSchemeRecs
    selectedSchemeRec
    selectedIntRate

    @wire(fetchCustType,{
        recFdId:'$recordId'

    })wiredCusType({data,error}){
        if(data){
            let option = [];
            option.push({label:data.Customer_Type__c, value:data.Customer_Type__c})
            this.customerOptions=option
            console.log('Customer Type is ::: ' + JSON.stringify(this.customerOptions))
        }
        else if(error){
            console.error('The error is ' + JSON.stringify(error))
        }
    }

    cusTypeChange(event){
        this.selectedCusType=event.detail.value
        console.log('Selected Customer Type : ' + event.detail.value)
    }

    @wire(getObjectInfo,{objectApiName:FD_Details_Local})
    fdObjectInfo

    @wire(getPicklistValues,{fieldApiName:Dep_Type_Local,recordTypeId:'$fdObjectInfo.data.defaultRecordTypeId'})
    wiredDepData({data,error}){
        if(data){
            let option = [];
            data.values.forEach(fdRec=>{
                option.push({label:fdRec.label, value:fdRec.value})    
            })
            this.depTypeOptions=option
            console.log('Deposit Type is ::: ' + JSON.stringify(this.depTypeOptions))
        }else if(error){
            console.error('The error is ' + JSON.stringify(error))
        }
    }

    @wire(getPicklistValues,{fieldApiName:Pay_Freq_Local,recordTypeId:'$fdObjectInfo.data.defaultRecordTypeId'})
    wiredPayData({data,error}){
        if(data){
            this.payoutFreqData=data
        }else if(error){
            console.error('The error is ' + JSON.stringify(error))
        }
    }

    depTypeChange(event){
        this.selectedDepType=event.detail.value
        console.log('Selected Customer Type : ' + event.detail.value)
        let key = this.payoutFreqData.controllerValues[event.detail.value]
        this.payFreqOptions=this.payoutFreqData.values.filter(opt=>opt.validFor.includes(key))
    }

    payFreqChange(event){
        this.selectedPayFreq=event.detail.value
        console.log('Selected Payout Frequency : ' + event.detail.value)
    }

    get tenorMonthsOptions(){
        let options=[]  
        /*
        options.push({label:'1',value:'1'})
         options.push({label:'2',value:'2'})*/
         for(var counter=0;counter<=84;counter++){
            options.push({label:counter.toString(),value:counter.toString()})  // ['0','1','2','3','4',...]
         }
         return options
    }

    tenorMonthChange(event){
        this.selectedTenorMonth=event.detail.value
        console.log('Selected Tenor In Month : ' + event.detail.value)
    }

    get tenorDaysOptions(){
        let options=[]  
        /*
        options.push({label:'1',value:'1'})
         options.push({label:'2',value:'2'})*/
         for(var counter=0;counter<=29;counter++){
            options.push({label:counter.toString(),value:counter.toString()})  // ['1','2','3','4',...]
         }
         return options
    }

    tenorDayChange(event){
        this.selectedTenorDay=event.detail.value
        console.log('Selected Tenor In Day : ' + event.detail.value)
    }

    fDAmountChange(event){
        this.givenfDAmount=event.detail.value
        console.log('Written FD Amount : ' + event.detail.value)
    }
    fetchScheme(event){
        let isValid = true //flag variable
        let inputFields = this.template.querySelectorAll('.forFetchSchemeButton') //('lightning-combobox')
        inputFields.forEach(inputField=>{
            if(!inputField.checkValidity()){
                inputField.reportValidity()
                isValid=false
            }
        })
        if(isValid){
            fetchSchemeMethod({
                cusType:this.selectedCusType,
                depType:this.selectedDepType,
                tnrMnth:this.selectedTenorMonth,
                tnrDay:this.selectedTenorDay,
                fdAmount:this.givenfDAmount
            })
            .then(result=>{
                if(result){
                    var schemeArray = []
                    for(var counter=0;counter<result.length;counter++){
                        var tempVar = {}
                        tempVar.label=result[counter].Name
                        tempVar.value=result[counter].Id
                        tempVar.interestRate=result[counter].Interest_Rate__c
                        schemeArray.push(tempVar)
                    }
                    this.intSchemeRecs=schemeArray
                }
                console.log('Int Scheme Record: ' + JSON.stringify(result))
            })
            .catch(error=>{
                console.error('We have an error: ' + error.message)
            })

            
        }
    }
    schemeChange(event){
        console.log('Int Scheme Record: ' + event.detail.value)
       
        var schmRecId= event.detail.value;
        for(var counter=0;counter<this.intSchemeRecs.length;counter++){
            if(schmRecId==this.intSchemeRecs[counter].value){
                this.selectedIntRate=this.intSchemeRecs[counter].interestRate
                this.selectedSchemeRec=schmRecId
                break;
            }
        }

    }
    save(event){
        let isValid = true //flag variable
        let inputFields = this.template.querySelectorAll('.forFetchSchemeButton') //('lightning-combobox')
        inputFields.forEach(inputField=>{
            if(!inputField.checkValidity()){
                inputField.reportValidity()
                isValid=false
            }
        })
        inputFields = this.template.querySelector('.forSaveButton')
            if(!inputFields.checkValidity()){
                inputFields.reportValidity()
                isValid=false
            }
        if(isValid){
            updateFDRecord({
                fdRecId:this.recordId,
                depType:this.selectedDepType,
                tnrMnth:this.selectedTenorMonth,
                tnrDay:this.selectedTenorDay,
                fdAmount:this.givenfDAmount,
                payFreq:this.selectedPayFreq,
                intrRate:this.selectedIntRate,
                IntrSchID:this.selectedSchemeRec
            })
            .then(result=>{
                console.log('Save Operation is done : ' + JSON.stringify(result))
                const event = new ShowToastEvent({
                    title:'success',
                    message:'Record Updated!',
                    variant:'Success'
                })
                this.dispatchEvent(event)
            })
            .catch(error=>{
                console.error('Error detected! ' + error.message)
                const event = new ShowToastEvent({
                    title:'Error',
                    message:'There is an error!',
                    variant:'error'
                })
                this.dispatchEvent(event)
            })
        }
    }
}