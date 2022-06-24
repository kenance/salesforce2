import { LightningElement, wire, api } from 'lwc';
import { getPicklistValues, getObjectInfo } from 'lightning/uiObjectInfoApi';
import Intermediate_Local from '@salesforce/schema/FD_Applicant_Intermediate__c'
import Applicants_Local from '@salesforce/schema/FD_Applicant_Intermediate__c.Type__c'
import saveRecordApplicants from '@salesforce/apex/FdDetailsFields.saveRecords'
import showIntermediateRecords from '@salesforce/apex/FdDetailsFields.showInterRecords'
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class CreateApplicants extends LightningElement {
    applTypeOptions
    selectedApplType=''
    showAddApplicant=false
    applicantRec={}
    @api recordId
    listSavedApplicants

    @wire(getObjectInfo,{objectApiName:Intermediate_Local})
    intermediateObjectInfo

    @wire(getPicklistValues,{fieldApiName:Applicants_Local,recordTypeId:'$intermediateObjectInfo.data.defaultRecordTypeId'})
    wiredIntermediateValues({data,error}){
        if(data){
            let options = []
            data.values.forEach(element=>{
                options.push({label:element.label, value:element.value}) 

            })
            this.applTypeOptions=options
            console.log('Applicant types are ' + JSON.stringify(this.applTypeOptions))
        }else if(error){
            console.error('The error is ' + JSON.stringify(error))
        }

    }

    applTypeChange(event){
            this.selectedApplType=event.detail.value
            console.log('Selected Applicant is ' + JSON.stringify(this.selectedApplType))
    }

    addApplicant(event){
        let isValid= true
        let validatePicklist = this.template.querySelector('lightning-combobox') 
        if(!validatePicklist.checkValidity()){
            validatePicklist.reportValidity()
            isValid=false
            this.showAddApplicant=false
        }
        if(isValid){
            let isExist = false
            this.listSavedApplicants.forEach(element=>{
                if(element.Type__c==this.selectedApplType){
                    isExist=true
                }
            })
            if(isExist){
                const toastEvent = new ShowToastEvent({
                    title:'Error',
                    variant:'error',
                    message:'This applicant type has already been added!'
                })
                this.dispatchEvent(toastEvent)
            }else{
                this.showAddApplicant=true
            }
            
        }
        
    }

    firstNameChange(event){
        this.applicantRec.First_Name__c=event.detail.value
    }

    lastNameChange(event){
        this.applicantRec.Last_Name__c=event.detail.value
    }

    ssnChange(event){
        this.applicantRec.SSN__c=event.detail.value
        console.log('Written SSN is ' + event.detail.value)
    }

    dateChange(event){
        this.applicantRec.DOB__c=event.detail.value
    }

    mobileChange(event){
        this.applicantRec.Mobile__c=event.detail.value
    }

    emailChange(event){
        this.applicantRec.Email__c=event.detail.value
    }

    addressChange(event){
        this.applicantRec.Address__c=event.detail.value
    }

    closeClick(event){
        this.showAddApplicant=false
    }

    saveClick(event){
        let isValid = true
        this.template.querySelectorAll('lightning-input').forEach(element=>{
            if(!element.checkValidity()){
                element.reportValidity()
                isValid=false
            }
        })
            if(!this.template.querySelector('lightning-textarea').checkValidity()){
                this.template.querySelector('lightning-textarea').reportValidity()
                isValid=false
            }
        

        if(isValid){
            if(Date().parseInt() - this.applicantRec.DOB__c.parseInt() <= 17){
                const toastEvent = new ShowToastEvent({
                    title:'Error',
                    variant:'error',
                    message:'The Applicant cant be under 18!'
                })
                this.dispatchEvent(toastEvent)
            }else{

            
            saveRecordApplicants({
                applRecord:this.applicantRec,
                applType:this.selectedApplType,
                fdRecId:this.recordId
            })
            .then(result=>{
                if(result.isSuccess){
                    this.listSavedApplicants=result.applicantInt
                    this.showAddApplicant=false
                }else{
                    const toastEvent = new ShowToastEvent({
                        title:'Error',
                        variant:'error',
                        message:result.errorMessage
                    })
                    this.dispatchEvent(toastEvent)
                }
            })
            .catch(error=>{
                console.error('The error is ' + JSON.stringify(error))
            })
        }
    }
    }

    @wire(showIntermediateRecords,{
        fdRecId:'$recordId'
    })wiredInterRec({data,error}){
        if(data){
            this.listSavedApplicants=data
        }else if(error){
            console.error(JSON.stringify(error))
        }
    }
}