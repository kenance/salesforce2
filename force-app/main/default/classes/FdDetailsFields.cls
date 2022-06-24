public with sharing class FdDetailsFields {
    public class ApplicantRecordsWrapper{
        @AuraEnabled
        public List<FD_Applicant_Intermediate__c> applicantInt;
        @AuraEnabled
        public Boolean isSuccess;
        @AuraEnabled
        public String errorMessage;
    }
    @AuraEnabled(cacheable=true)
    public static FD_Details__c fetchCustomerType(String recFdId){
    FD_Details__c fdRec = [SELECT Id, Name, Customer_Type__c FROM FD_Details__c WHERE Id=:recFdId];
    return fdRec;
    }
    @AuraEnabled(cacheable=true)
    public static List<Interest_Scheme__c> fetchSchemes(String cusType, String depType, Integer tnrMnth, Integer tnrDay, Integer fdAmount){
        System.debug('Deposit Type: ' + depType);
        System.debug('Customer Type: ' + cusType);
        System.debug('FD Amount: ' + fdAmount);
        System.debug('Tenor In Days: '  + tnrDay);
        System.debug('Tenor In Months: '  + tnrMnth);


    List<Interest_Scheme__c> listScheme = [SELECT Id, Name, Customer_Type__c, Deposit_Type__c, Interest_Rate__c,
                                          From_Amount__c, To_Amount__c, Tenor_From_Days__c, Tenor_To_Days__c, Tenor_From_Months__c, Tenor_To_Months__c
                                          FROM Interest_Scheme__c WHERE Customer_Type__c=:cusType AND Deposit_Type__c=:depType AND From_Amount__c<=:fdAmount
                                          AND To_Amount__c>=:fdAmount AND Tenor_From_Days__c<=:tnrDay AND Tenor_To_Days__c>=:tnrDay AND Tenor_From_Months__c<=:tnrMnth
                                          AND Tenor_To_Months__c>=:tnrMnth];
    return listScheme;                                   
    }
    @AuraEnabled
    public static void updateFD(String fdRecId, String depType, Integer tnrMnth, Integer tnrDay, Integer fdAmount, String payFreq, Decimal intrRate, String IntrSchID){
        System.debug('Deposit Type: ' + depType);
        System.debug('Payout Frequency: ' + payFreq);
        System.debug('FD Amount: ' + fdAmount);
        System.debug('Tenor In Days: '  + tnrDay);
        System.debug('Tenor In Months: '  + tnrMnth);
        System.debug('FD Record ID: '  + fdRecId);
        System.debug('Interest Rate: '  + intrRate);
        System.debug('Interest Scheme Record: '  + IntrSchID);

        FD_Details__c myFdRec = new FD_Details__c();
        myFdRec.Id=fdRecId;
        myFdRec.Deposit_Type__c=depType;
        myFdRec.Payout_Frequency__c=payFreq;
        myFdRec.Interest_Rate__c=intrRate;
        myFdRec.FD_Amount__c=fdAmount;
        myFdRec.Interest_Scheme__c=IntrSchID;
        myFdRec.Tenor_In_Days__c=tnrDay;
        myFdRec.Tenor_In_Months__c=tnrMnth;

        update myFdRec;

    }
    @AuraEnabled
    public static ApplicantRecordsWrapper saveRecords(Applicant_Details__c applRecord, String applType, String fdRecId){
        ApplicantRecordsWrapper instWrapper = new ApplicantRecordsWrapper();
        if(applRecord!=null){
        List<Applicant_Details__c> existingAppl = [SELECT Id FROM Applicant_Details__c WHERE SSN__c=:applRecord.SSN__c];
        if(existingAppl!=null&&existingAppl.size()>0){
            applRecord.Id=existingAppl[0].Id;
            System.debug('Id of the record: ' + applRecord.Id);
        }
        upsert applRecord;
       }

       List<FD_Applicant_Intermediate__c> intRecs = [SELECT Id, Name, Type__c, FD_Details__c, Applicant_Details__r.SSN__c FROM FD_Applicant_Intermediate__c WHERE FD_Details__c=:fdRecId];
       instWrapper.isSuccess=true;
       instWrapper.errorMessage='';
       if(intRecs!=null && intRecs.size()>0){
            for(FD_Applicant_Intermediate__c fdInt:intRecs){
                if((fdInt.FD_Details__c==fdRecId) && (applRecord.SSN__c==fdInt.Applicant_Details__r.SSN__c)){
                    instWrapper.isSuccess=false;
                    System.debug('Record cant be saved!');
                    instWrapper.errorMessage='The primary applicant and the nominee cant be the same person!';
                }
            }
       }
       if(instWrapper.isSuccess){
        FD_Applicant_Intermediate__c newInterRec = new FD_Applicant_Intermediate__c();
        newInterRec.Applicant_Details__c=applRecord.Id;
        newInterRec.FD_Details__c=fdRecId;
        newInterRec.Type__c=applType;
        insert newInterRec;
        List<FD_Applicant_Intermediate__c> savedInterRecords = FdDetailsFields.showInterRecords(fdRecId);
        instWrapper.applicantInt=savedInterRecords;
       }
       return instWrapper;
    }
    @AuraEnabled(cacheable=true)
    public static List<FD_Applicant_Intermediate__c> showInterRecords(String fdRecId){
        List<FD_Applicant_Intermediate__c> shownRecords = [SELECT Id, Applicant_Details__r.First_Name__c, Applicant_Details__r.Last_Name__c, Type__c FROM FD_Applicant_Intermediate__c WHERE FD_Details__c=:fdRecId];
        return shownRecords;
    }
}
