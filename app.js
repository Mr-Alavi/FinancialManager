let data = JSON.parse(localStorage.getItem("financialData")) || {

    transactions: [],
    debts: 0,
    goals: 0

};



function save(){

    localStorage.setItem(
        "financialData",
        JSON.stringify(data)
    );

}




function calculate(){


let balance = 0;
let income = 0;
let expense = 0;



data.transactions.forEach(item=>{


    if(item.type==="income"){

        income += item.amount;
        balance += item.amount;

    }
    else{

        expense += item.amount;
        balance -= item.amount;

    }


});



document.getElementById("balance").innerText =
balance.toLocaleString()+" تومان";


document.getElementById("income").innerText =
income.toLocaleString()+" تومان";


document.getElementById("expense").innerText =
expense.toLocaleString()+" تومان";


document.getElementById("debt").innerText =
data.debts.toLocaleString()+" تومان";


document.getElementById("goal").innerText =
data.goals.toLocaleString()+" تومان";



showTransactions();


}







function addTransaction(){


let type = prompt(
"نوع تراکنش:\n1 = درآمد\n2 = هزینه"
);



let amount = Number(
prompt("مبلغ را وارد کنید")
);



if(!amount) return;



let title = prompt(
"عنوان:"
) || "بدون عنوان";





data.transactions.unshift({

type:
type==="1"
?
"income"
:
"expense",


amount:amount,


title:title,


date:new Date()
.toLocaleDateString("fa-IR")

});



save();

calculate();



alert("✅ ثبت شد");


}







function showTransactions(){


let box =
document.getElementById(
"transactions"
);



box.innerHTML="";



data.transactions
.slice(0,10)
.forEach(item=>{



let div =
document.createElement("div");



div.className =
"transaction "+
