Sepearte Interface Table
We will have sperate interface module

so creae interface table with name if_call_transaction_list, if_call_coverage_code_list, if_call_message_list
transactions --> if_call_transactions: when we created 'CALL' transaction with 'Waiting', create record in table if_call_transactions
coverage_by_code --> if_call_coverage_code_list: when create if_call_transactions, create record in table if_call_coverage_code_list, copy from coverage_by_code


Step2 
Start Call
when user click Start Call



ai_call_history --> if_call_message_list
during the call update  if_call_coverage_code_list, if_call_message by data return
and process end, update status for if_call_transactions



  if user click start call, create ai_if_call, ai_if_call_coverage_list, ai_if_call_message_list\
  when complete change the status as complted, when start inProgress\




 we will have sperate module, with python, create folder and put all code in the backend_ai_if\
  and also create seperate table start table name wiht ai_if_tablename\
  if user click start call, create ai_if_call, ai_if_call_coverage_list, ai_if_call_message_list\
  when complete change the status as complted, when start inProgress\
  ai_if_call_coverage, copy data from coverage_by_cod, \
  after complted update transactions,  