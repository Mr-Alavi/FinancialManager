let transactions = JSON.parse(localStorage.getItem("transactions")) || [];


function save(){
    localStorage.setItem(
        "transactions",
        JSON.stringify(transactions)
    );
}


function update(){

    let balance = 0;
    let income = 0;
    let expense = 0;


    transactions.forEach(t => {

        if(t.type === "income"){
            income += t.amount;
            balance += t.amount;
        }

        else{
            expense += t.amount;
            balance -= t.amount;
        }

    });


    document.getElementById("balance").innerText =
    balance.toLocaleString()+" تومان";


    document.getElementById("income").innerText =
    income.toLocaleString()+" تومان";


    document.getElementById("expense").innerText =
    expense.toLocaleString()+" تومان";

}



document.querySelector(".main-btn")
.onclick = function(){


let type = prompt(
"نوع تراکنش:\n1 درآمد\n2 خرج"
);


let amount = Number(
prompt("مبلغ:")
);


if(!amount) return;


transactions.push({

type: type === "1" ? "income" : "expense",

amount: amount,

date: new Date().toLocaleDateString("fa-IR")

});


save();

update();


alert("✅ ثبت شد");

}



update();
